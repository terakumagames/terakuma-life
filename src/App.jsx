import { useEffect, useMemo, useState } from 'react'
import TerakumaScene from './components/TerakumaScene.jsx'

const STORAGE_KEY = 'terakuma-life-v0.1'

// Ver.0.1の仮バランス。あとから簡単に調整できます。
const CONFIG = {
  hungerFullMinutes: 90,
  playFullMinutes: 120,
  zeroGraceSeconds: 60,
  recoverAmount: 30,
  recoveryPerOnigiri: 10,
}

const HUNGER_DECAY_PER_SECOND = 100 / (CONFIG.hungerFullMinutes * 60)
const PLAY_DECAY_PER_SECOND = 100 / (CONFIG.playFullMinutes * 60)

function createFreshGame() {
  return {
    hunger: 100,
    play: 100,
    onigiri: 0,
    rewardProgress: 0,
    hungerZeroSince: null,
    playZeroSince: null,
    status: 'active',
    lastUpdated: Date.now(),
  }
}

function advanceGame(previous, now = Date.now()) {
  if (!previous || previous.status !== 'active') return previous

  const lastUpdated = Number(previous.lastUpdated) || now
  const elapsedSeconds = Math.max(0, (now - lastUpdated) / 1000)

  let hungerZeroSince = previous.hungerZeroSince ?? null
  let playZeroSince = previous.playZeroSince ?? null

  const oldHunger = Math.max(0, Number(previous.hunger) || 0)
  const oldPlay = Math.max(0, Number(previous.play) || 0)

  const hunger = Math.max(0, oldHunger - HUNGER_DECAY_PER_SECOND * elapsedSeconds)
  const play = Math.max(0, oldPlay - PLAY_DECAY_PER_SECOND * elapsedSeconds)

  if (oldHunger > 0 && hunger <= 0 && hungerZeroSince == null) {
    hungerZeroSince = lastUpdated + (oldHunger / HUNGER_DECAY_PER_SECOND) * 1000
  }
  if (oldPlay > 0 && play <= 0 && playZeroSince == null) {
    playZeroSince = lastUpdated + (oldPlay / PLAY_DECAY_PER_SECOND) * 1000
  }

  const hungerFailAt = hungerZeroSince == null
    ? Infinity
    : hungerZeroSince + CONFIG.zeroGraceSeconds * 1000
  const playFailAt = playZeroSince == null
    ? Infinity
    : playZeroSince + CONFIG.zeroGraceSeconds * 1000

  let status = 'active'
  if (now >= Math.min(hungerFailAt, playFailAt)) {
    status = hungerFailAt <= playFailAt ? 'dead' : 'away'
  }

  return {
    ...previous,
    hunger,
    play,
    hungerZeroSince,
    playZeroSince,
    status,
    lastUpdated: now,
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createFreshGame()
    return advanceGame({ ...createFreshGame(), ...JSON.parse(raw) })
  } catch {
    return createFreshGame()
  }
}

function Meter({ label, icon, value, dangerText }) {
  const safeValue = Math.max(0, Math.min(100, value))
  const danger = safeValue <= 15

  return (
    <div className={`meter ${danger ? 'meter--danger' : ''}`}>
      <div className="meter__row">
        <span>{icon} {label}</span>
        <strong>{Math.ceil(safeValue)}</strong>
      </div>
      <div className="meter__track" aria-label={`${label} ${Math.ceil(safeValue)}%`}>
        <div className="meter__fill" style={{ width: `${safeValue}%` }} />
      </div>
      {danger && <small>{dangerText}</small>}
    </div>
  )
}

export default function App() {
  const [game, setGame] = useState(loadGame)
  const [reactionTick, setReactionTick] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => advanceGame(current))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const recover = (kind) => {
    if (game.status !== 'active') return

    const currentValue = kind === 'hunger' ? game.hunger : game.play
    const recovered = Math.min(CONFIG.recoverAmount, Math.max(0, 100 - currentValue))

    if (recovered <= 0) {
      setToast(kind === 'hunger' ? 'おなかはいっぱいです' : 'いまは満足しています')
      return
    }

    const totalProgress = game.rewardProgress + recovered
    const earned = Math.floor(totalProgress / CONFIG.recoveryPerOnigiri)
    const rewardProgress = totalProgress % CONFIG.recoveryPerOnigiri

    setGame((current) => ({
      ...current,
      [kind]: Math.min(100, current[kind] + recovered),
      [kind === 'hunger' ? 'hungerZeroSince' : 'playZeroSince']: null,
      onigiri: current.onigiri + earned,
      rewardProgress,
      lastUpdated: Date.now(),
    }))

    setReactionTick((value) => value + 1)
    setToast(
      earned > 0
        ? `${kind === 'hunger' ? 'ごはん' : 'あそび'} +${Math.round(recovered)}　🍙 ×${earned} GET!`
        : `${kind === 'hunger' ? 'ごはん' : 'あそび'} +${Math.round(recovered)}`,
    )
  }

  const resetGame = () => {
    const fresh = createFreshGame()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    setGame(fresh)
    setReactionTick((value) => value + 1)
    setToast('新しいてらくま生活が始まりました')
  }

  const gameOverText = useMemo(() => {
    if (game.status === 'dead') {
      return {
        title: 'てらくまは力尽きました',
        body: 'おなかが空っぽのまま長い時間が経ってしまいました。',
      }
    }
    if (game.status === 'away') {
      return {
        title: 'てらくまは遊びに出かけました',
        body: '「遊びにいってきます、探さないで下さい」',
      }
    }
    return null
  }, [game.status])

  return (
    <main className="app-shell">
      <section className="game-stage">
        <TerakumaScene status={game.status} reactionTick={reactionTick} />

        <header className="topbar">
          <div className="brand">
            <span className="brand__small">TERAKUMA</span>
            <strong>LIFE</strong>
          </div>
          <div className="wallet" title="SHOPで使うゲーム内通貨">
            <span>🍙</span>
            <strong>{game.onigiri}</strong>
          </div>
        </header>

        {game.status === 'active' && (
          <>
            <aside className="status-panel">
              <Meter
                label="おなか"
                icon="🍚"
                value={game.hunger}
                dangerText="空っぽのまま放置すると危険です"
              />
              <Meter
                label="あそんで"
                icon="🎮"
                value={game.play}
                dangerText="遊ばないままだと家出してしまいます"
              />
            </aside>

            <div className="action-dock">
              <button className="action-button" onClick={() => recover('hunger')}>
                <span>🍚</span>
                <b>ごはん</b>
              </button>
              <button className="action-button" onClick={() => recover('play')}>
                <span>🎾</span>
                <b>あそぶ</b>
              </button>
              <button className="action-button action-button--future" disabled>
                <span>🛍️</span>
                <b>SHOP</b>
                <small>準備中</small>
              </button>
              <button className="action-button action-button--future" disabled>
                <span>🛋️</span>
                <b>ルーム</b>
                <small>準備中</small>
              </button>
              <button className="action-button action-button--future" disabled>
                <span>👕</span>
                <b>着替え</b>
                <small>準備中</small>
              </button>
            </div>
          </>
        )}

        {gameOverText && (
          <div className="gameover-backdrop">
            <div className="gameover-card">
              <div className="gameover-card__icon">{game.status === 'dead' ? '🪦' : '✉️'}</div>
              <h1>{gameOverText.title}</h1>
              <p>{gameOverText.body}</p>
              <p className="gameover-card__notice">この状態ではリセット以外の操作はできません。</p>
              <button onClick={resetGame}>最初からやり直す</button>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        <div className="prototype-tag">Ver.0.1 PROTOTYPE</div>
      </section>
    </main>
  )
}
