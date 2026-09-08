import { useEffect, useMemo, useState } from 'react'
import TerakumaScene from './components/TerakumaScene.jsx'

const STORAGE_KEY = 'terakuma-life-v0.2'
const LEGACY_STORAGE_KEY = 'terakuma-life-v0.1'

const CONFIG = {
  hungerFullMinutes: 90,
  playFullMinutes: 120,
  zeroGraceSeconds: 2 * 60 * 60,
  recoverAmount: 30,
  recoveryPerOnigiri: 10,
}

const SHOP_CATEGORIES = [
  { id: 'furniture', label: '家具', icon: '🛋️' },
  { id: 'clothes', label: '衣装', icon: '👕' },
  { id: 'other', label: 'その他', icon: '🎨' },
]

const SHOP_ITEMS = [
  { id: 'chair-basic', category: 'furniture', name: 'シンプルチェア', icon: '🪑', price: 4, description: 'まずは一脚。座るモーションは今後追加予定。' },
  { id: 'table-basic', category: 'furniture', name: 'ローテーブル', icon: '▰', price: 6, description: '部屋の中心に置きやすい小さなテーブル。' },
  { id: 'sofa-basic', category: 'furniture', name: 'ソファ', icon: '🛋️', price: 10, description: 'くつろぎ家具。今後てらくまが座ります。' },
  { id: 'tv-basic', category: 'furniture', name: 'テレビ', icon: '📺', price: 12, description: 'てらくまの暇つぶし候補。' },
  { id: 'wardrobe-basic', category: 'furniture', name: 'タンス', icon: '🗄️', price: 8, description: '衣装をしまう家具。' },
  { id: 'dumbbell-basic', category: 'furniture', name: 'ダンベル', icon: '🏋️', price: 5, description: '筋トレ好きのてらくま向け。' },
  { id: 'treadmill-basic', category: 'furniture', name: 'ランニングマシン', icon: '🏃', price: 15, description: '本格的なトレーニング器具。' },

  { id: 'cap-basic', category: 'clothes', name: 'キャップ', icon: '🧢', price: 5, description: '帽子カテゴリの最初のアイテム。' },
  { id: 'top-basic', category: 'clothes', name: 'Tシャツ', icon: '👕', price: 6, description: 'トップス。着せ替え機能は次段階で対応。' },
  { id: 'bottom-basic', category: 'clothes', name: 'パンツ', icon: '👖', price: 6, description: 'ボトムス。' },
  { id: 'shoes-basic', category: 'clothes', name: 'スニーカー', icon: '👟', price: 7, description: '足元の着せ替え用。' },
  { id: 'accessory-basic', category: 'clothes', name: 'ネックレス', icon: '📿', price: 8, description: 'サングラス以外のアクセサリー第一号。' },

  { id: 'wallpaper-warm', category: 'other', name: 'あたたかい壁紙', icon: '🟨', price: 7, description: '壁の色・質感変更用アイテム。' },
  { id: 'floor-wood', category: 'other', name: 'ウッド床', icon: '🟫', price: 7, description: '床材変更用アイテム。' },
]

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
    ownedItems: [],
    lastUpdated: Date.now(),
  }
}

function normalizeGame(saved) {
  const fresh = createFreshGame()
  return {
    ...fresh,
    ...saved,
    ownedItems: Array.isArray(saved?.ownedItems) ? saved.ownedItems : [],
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
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return createFreshGame()
    return advanceGame(normalizeGame(JSON.parse(raw)))
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

function ShopModal({ game, category, setCategory, onClose, onBuy }) {
  const items = SHOP_ITEMS.filter((item) => item.category === category)
  const owned = new Set(game.ownedItems)

  return (
    <div className="shop-backdrop" onMouseDown={onClose}>
      <section className="shop-panel" onMouseDown={(event) => event.stopPropagation()} aria-label="SHOP">
        <header className="shop-header">
          <div>
            <span className="shop-kicker">TERAKUMA LIFE</span>
            <h1>SHOP</h1>
          </div>
          <div className="shop-header__right">
            <div className="shop-wallet"><span>🍙</span><strong>{game.onigiri}</strong></div>
            <button className="shop-close" onClick={onClose} aria-label="SHOPを閉じる">×</button>
          </div>
        </header>

        <nav className="shop-tabs" aria-label="商品カテゴリ">
          {SHOP_CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              className={category === tab.id ? 'shop-tab shop-tab--active' : 'shop-tab'}
              onClick={() => setCategory(tab.id)}
            >
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>

        <div className="shop-grid">
          {items.map((item) => {
            const isOwned = owned.has(item.id)
            const canAfford = game.onigiri >= item.price
            return (
              <article className="shop-item" key={item.id}>
                <div className="shop-item__preview" aria-hidden="true">{item.icon}</div>
                <div className="shop-item__body">
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <div className="shop-item__bottom">
                    <strong className="shop-price">🍙 {item.price}</strong>
                    <button
                      className={isOwned ? 'shop-buy shop-buy--owned' : 'shop-buy'}
                      disabled={isOwned || !canAfford}
                      onClick={() => onBuy(item)}
                    >
                      {isOwned ? '購入済み' : canAfford ? '購入する' : 'おにぎり不足'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <footer className="shop-footer">
          購入したアイテムは保存されます。家具配置・着せ替え・壁床変更は次のバージョンで使用可能になります。
        </footer>
      </section>
    </div>
  )
}

export default function App() {
  const [game, setGame] = useState(loadGame)
  const [reactionTick, setReactionTick] = useState(0)
  const [toast, setToast] = useState(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [shopCategory, setShopCategory] = useState('furniture')

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

  useEffect(() => {
    if (game.status !== 'active') setShopOpen(false)
  }, [game.status])

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

  const buyItem = (item) => {
    if (game.status !== 'active') return
    if (game.ownedItems.includes(item.id)) {
      setToast('そのアイテムは購入済みです')
      return
    }
    if (game.onigiri < item.price) {
      setToast('おにぎりが足りません')
      return
    }

    setGame((current) => ({
      ...current,
      onigiri: current.onigiri - item.price,
      ownedItems: [...current.ownedItems, item.id],
      lastUpdated: Date.now(),
    }))
    setToast(`${item.name}を購入しました！`)
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
        body: 'おなかが0のまま2時間が経ってしまいました。',
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
                dangerText="0のまま2時間経過すると力尽きます"
              />
              <Meter
                label="あそんで"
                icon="🎮"
                value={game.play}
                dangerText="0のまま2時間経過すると家出します"
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
              <button className="action-button" onClick={() => setShopOpen(true)}>
                <span>🛍️</span>
                <b>SHOP</b>
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

        {shopOpen && game.status === 'active' && (
          <ShopModal
            game={game}
            category={shopCategory}
            setCategory={setShopCategory}
            onClose={() => setShopOpen(false)}
            onBuy={buyItem}
          />
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

        <div className="prototype-tag">Ver.0.2 PROTOTYPE</div>
      </section>
    </main>
  )
}
