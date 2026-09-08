import { useEffect, useMemo, useState } from 'react'
import TerakumaScene from './components/TerakumaScene.jsx'

const STORAGE_KEY = 'terakuma-life-v0.3'
const LEGACY_STORAGE_KEYS = ['terakuma-life-v0.2', 'terakuma-life-v0.1']

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
  { id: 'chair-basic', category: 'furniture', name: 'シンプルチェア', icon: '🪑', price: 4, description: '木製のシンプルな椅子。' },
  { id: 'table-basic', category: 'furniture', name: 'ローテーブル', icon: '▰', price: 6, description: '部屋の中心にも置きやすいローテーブル。' },
  { id: 'sofa-basic', category: 'furniture', name: 'ソファ', icon: '🛋️', price: 10, description: 'てらくまがくつろげそうな2人掛けソファ。' },
  { id: 'tv-basic', category: 'furniture', name: 'テレビ', icon: '📺', price: 12, description: '薄型テレビ。今後は視聴アクションにも対応予定。' },
  { id: 'wardrobe-basic', category: 'furniture', name: 'タンス', icon: '🗄️', price: 8, description: '衣装をしまう木製タンス。' },
  { id: 'dumbbell-basic', category: 'furniture', name: 'ダンベル', icon: '🏋️', price: 5, description: '筋トレ用。今後てらくまが使います。' },
  { id: 'treadmill-basic', category: 'furniture', name: 'ランニングマシン', icon: '🏃', price: 15, description: '本格的なトレーニング器具。' },

  { id: 'cap-basic', category: 'clothes', name: 'キャップ', icon: '🧢', price: 5, description: '帽子カテゴリの最初のアイテム。' },
  { id: 'top-basic', category: 'clothes', name: 'Tシャツ', icon: '👕', price: 6, description: 'トップス。着せ替え機能は次段階で対応。' },
  { id: 'bottom-basic', category: 'clothes', name: 'パンツ', icon: '👖', price: 6, description: 'ボトムス。' },
  { id: 'shoes-basic', category: 'clothes', name: 'スニーカー', icon: '👟', price: 7, description: '足元の着せ替え用。' },
  { id: 'accessory-basic', category: 'clothes', name: 'ネックレス', icon: '📿', price: 8, description: 'サングラス以外のアクセサリー第一号。' },

  { id: 'wallpaper-warm', category: 'other', name: 'あたたかい壁紙', icon: '🟨', price: 7, description: '壁をやわらかなベージュ系に変更します。' },
  { id: 'floor-wood', category: 'other', name: 'ウッド床', icon: '🟫', price: 7, description: '床を木目調の色合いに変更します。' },
]

const FURNITURE_ITEMS = SHOP_ITEMS.filter((item) => item.category === 'furniture')
const HUNGER_DECAY_PER_SECOND = 100 / (CONFIG.hungerFullMinutes * 60)
const PLAY_DECAY_PER_SECOND = 100 / (CONFIG.playFullMinutes * 60)

function createFreshGame() {
  return {
    hunger: 100,
    play: 100,
    onigiri: 30,
    rewardProgress: 0,
    hungerZeroSince: null,
    playZeroSince: null,
    status: 'active',
    ownedItems: [],
    placedFurniture: [],
    roomStyle: { wallpaper: 'default', floor: 'default' },
    v03GiftReceived: true,
    lastUpdated: Date.now(),
  }
}

function normalizeGame(saved) {
  const fresh = createFreshGame()
  const normalized = {
    ...fresh,
    ...saved,
    ownedItems: Array.isArray(saved?.ownedItems) ? saved.ownedItems : [],
    placedFurniture: Array.isArray(saved?.placedFurniture) ? saved.placedFurniture : [],
    roomStyle: {
      wallpaper: saved?.roomStyle?.wallpaper ?? 'default',
      floor: saved?.roomStyle?.floor ?? 'default',
    },
  }

  if (!saved?.v03GiftReceived) {
    normalized.onigiri = Math.max(0, Number(saved?.onigiri) || 0) + 30
    normalized.v03GiftReceived = true
  }

  return normalized
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
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const key of LEGACY_STORAGE_KEYS) {
        raw = localStorage.getItem(key)
        if (raw) break
      }
    }
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
          購入した家具・壁紙・床材は「ルーム」から使用できます。衣装の着せ替えは次の段階で対応します。
        </footer>
      </section>
    </div>
  )
}

function RoomEditor({
  game,
  selectedFurnitureId,
  setSelectedFurnitureId,
  onPlace,
  onUpdate,
  onRemove,
  onRoomStyle,
  onFinish,
}) {
  const [tab, setTab] = useState('furniture')
  const ownedFurniture = FURNITURE_ITEMS.filter((item) => game.ownedItems.includes(item.id))
  const placedIds = new Set(game.placedFurniture.map((item) => item.itemId))
  const selectedPlacement = game.placedFurniture.find((item) => item.itemId === selectedFurnitureId)
  const selectedItem = FURNITURE_ITEMS.find((item) => item.id === selectedFurnitureId)

  const wallpaperOwned = game.ownedItems.includes('wallpaper-warm')
  const floorOwned = game.ownedItems.includes('floor-wood')

  return (
    <aside className="room-editor">
      <header className="room-editor__header">
        <div>
          <span className="room-editor__kicker">TERAKUMA LIFE</span>
          <h1>ROOM LAYOUT</h1>
        </div>
        <button className="room-editor__done" onClick={onFinish}>完成</button>
      </header>

      <div className="room-editor__tabs">
        <button className={tab === 'furniture' ? 'room-tab room-tab--active' : 'room-tab'} onClick={() => setTab('furniture')}>🛋️ 家具</button>
        <button className={tab === 'surface' ? 'room-tab room-tab--active' : 'room-tab'} onClick={() => setTab('surface')}>🎨 壁・床</button>
      </div>

      {tab === 'furniture' && (
        <div className="room-editor__body">
          <p className="room-editor__help">購入した家具を配置できます。配置後は家具をタップして位置と向きを調整してください。</p>

          <div className="room-inventory">
            {ownedFurniture.length === 0 && (
              <div className="room-empty">まだ家具を持っていません。SHOPで家具を購入するとここに並びます。</div>
            )}
            {ownedFurniture.map((item) => {
              const placed = placedIds.has(item.id)
              const selected = selectedFurnitureId === item.id
              return (
                <button
                  key={item.id}
                  className={`room-inventory__item ${selected ? 'room-inventory__item--selected' : ''}`}
                  onClick={() => placed ? setSelectedFurnitureId(item.id) : onPlace(item.id)}
                >
                  <span>{item.icon}</span>
                  <b>{item.name}</b>
                  <small>{placed ? '配置済み' : '配置する'}</small>
                </button>
              )
            })}
          </div>

          {selectedPlacement && selectedItem && (
            <section className="room-controls">
              <div className="room-controls__title">
                <span>{selectedItem.icon}</span>
                <div><b>{selectedItem.name}</b><small>選択中</small></div>
              </div>

              <label>
                <span>左右</span>
                <input
                  type="range"
                  min="-3.8"
                  max="3.8"
                  step="0.1"
                  value={selectedPlacement.x}
                  onChange={(event) => onUpdate(selectedPlacement.itemId, { x: Number(event.target.value) })}
                />
                <strong>{selectedPlacement.x.toFixed(1)}</strong>
              </label>

              <label>
                <span>奥行</span>
                <input
                  type="range"
                  min="-2.8"
                  max="2.8"
                  step="0.1"
                  value={selectedPlacement.z}
                  onChange={(event) => onUpdate(selectedPlacement.itemId, { z: Number(event.target.value) })}
                />
                <strong>{selectedPlacement.z.toFixed(1)}</strong>
              </label>

              <div className="room-rotate">
                <span>向き</span>
                <button onClick={() => onUpdate(selectedPlacement.itemId, { rotation: selectedPlacement.rotation - Math.PI / 4 })}>↺ 45°</button>
                <button onClick={() => onUpdate(selectedPlacement.itemId, { rotation: selectedPlacement.rotation + Math.PI / 4 })}>45° ↻</button>
              </div>

              <button className="room-remove" onClick={() => onRemove(selectedPlacement.itemId)}>部屋から片付ける</button>
            </section>
          )}
        </div>
      )}

      {tab === 'surface' && (
        <div className="room-editor__body">
          <section className="surface-section">
            <h2>壁紙</h2>
            <div className="surface-options">
              <button
                className={game.roomStyle.wallpaper === 'default' ? 'surface-option surface-option--active' : 'surface-option'}
                onClick={() => onRoomStyle('wallpaper', 'default')}
              >
                <span className="surface-swatch surface-swatch--wall-default" />
                <b>標準</b>
              </button>
              <button
                disabled={!wallpaperOwned}
                className={game.roomStyle.wallpaper === 'wallpaper-warm' ? 'surface-option surface-option--active' : 'surface-option'}
                onClick={() => onRoomStyle('wallpaper', 'wallpaper-warm')}
              >
                <span className="surface-swatch surface-swatch--wall-warm" />
                <b>あたたかい壁紙</b>
                {!wallpaperOwned && <small>未購入</small>}
              </button>
            </div>
          </section>

          <section className="surface-section">
            <h2>床</h2>
            <div className="surface-options">
              <button
                className={game.roomStyle.floor === 'default' ? 'surface-option surface-option--active' : 'surface-option'}
                onClick={() => onRoomStyle('floor', 'default')}
              >
                <span className="surface-swatch surface-swatch--floor-default" />
                <b>標準</b>
              </button>
              <button
                disabled={!floorOwned}
                className={game.roomStyle.floor === 'floor-wood' ? 'surface-option surface-option--active' : 'surface-option'}
                onClick={() => onRoomStyle('floor', 'floor-wood')}
              >
                <span className="surface-swatch surface-swatch--floor-wood" />
                <b>ウッド床</b>
                {!floorOwned && <small>未購入</small>}
              </button>
            </div>
          </section>
        </div>
      )}

      <footer className="room-editor__footer">変更内容は自動保存されます。完成を押すと、てらくまが新しい部屋を喜びます。</footer>
    </aside>
  )
}

export default function App() {
  const [game, setGame] = useState(loadGame)
  const [reactionTick, setReactionTick] = useState(0)
  const [reactionAction, setReactionAction] = useState('happy')
  const [toast, setToast] = useState(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [shopCategory, setShopCategory] = useState('furniture')
  const [roomOpen, setRoomOpen] = useState(false)
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null)

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
    if (game.status !== 'active') {
      setShopOpen(false)
      setRoomOpen(false)
      setSelectedFurnitureId(null)
    }
  }, [game.status])

  const recover = (kind) => {
    if (game.status !== 'active' || roomOpen) return

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

    setReactionAction(kind)
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

  const openRoom = () => {
    setShopOpen(false)
    setSelectedFurnitureId(null)
    setRoomOpen(true)
  }

  const placeFurniture = (itemId) => {
    const spots = [
      [-2.7, -1.9],
      [0, -2.2],
      [2.7, -1.9],
      [-2.8, 1.25],
      [2.8, 1.25],
      [0, 1.9],
      [-1.4, 0.4],
      [1.4, 0.4],
    ]

    setGame((current) => {
      if (!current.ownedItems.includes(itemId)) return current
      if (current.placedFurniture.some((item) => item.itemId === itemId)) return current
      const spot = spots[current.placedFurniture.length % spots.length]
      return {
        ...current,
        placedFurniture: [
          ...current.placedFurniture,
          { itemId, x: spot[0], z: spot[1], rotation: 0 },
        ],
        lastUpdated: Date.now(),
      }
    })
    setSelectedFurnitureId(itemId)
  }

  const updateFurniture = (itemId, patch) => {
    setGame((current) => ({
      ...current,
      placedFurniture: current.placedFurniture.map((item) => {
        if (item.itemId !== itemId) return item
        return {
          ...item,
          ...patch,
          x: patch.x == null ? item.x : Math.max(-3.8, Math.min(3.8, patch.x)),
          z: patch.z == null ? item.z : Math.max(-2.8, Math.min(2.8, patch.z)),
        }
      }),
      lastUpdated: Date.now(),
    }))
  }

  const removeFurniture = (itemId) => {
    setGame((current) => ({
      ...current,
      placedFurniture: current.placedFurniture.filter((item) => item.itemId !== itemId),
      lastUpdated: Date.now(),
    }))
    setSelectedFurnitureId(null)
  }

  const updateRoomStyle = (kind, value) => {
    const requiredItem = value === 'wallpaper-warm'
      ? 'wallpaper-warm'
      : value === 'floor-wood'
        ? 'floor-wood'
        : null

    setGame((current) => {
      if (requiredItem && !current.ownedItems.includes(requiredItem)) return current
      return {
        ...current,
        roomStyle: { ...current.roomStyle, [kind]: value },
        lastUpdated: Date.now(),
      }
    })
  }

  const finishRoomLayout = () => {
    setRoomOpen(false)
    setSelectedFurnitureId(null)
    setReactionAction('happy')
    setReactionTick((value) => value + 1)
    setToast('新しい部屋になりました！')
  }

  const resetGame = () => {
    const fresh = createFreshGame()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    setGame(fresh)
    setShopOpen(false)
    setRoomOpen(false)
    setSelectedFurnitureId(null)
    setReactionAction('happy')
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
        <TerakumaScene
          status={game.status}
          reactionTick={reactionTick}
          reactionAction={reactionAction}
          placedFurniture={game.placedFurniture}
          roomStyle={game.roomStyle}
          layoutMode={roomOpen}
          selectedFurnitureId={selectedFurnitureId}
          onSelectFurniture={setSelectedFurnitureId}
        />

        {!roomOpen && (
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
        )}

        {game.status === 'active' && !roomOpen && (
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
              <button className="action-button" onClick={openRoom}>
                <span>🛋️</span>
                <b>ルーム</b>
              </button>
              <button className="action-button action-button--future" disabled>
                <span>👕</span>
                <b>着替え</b>
                <small>準備中</small>
              </button>
            </div>
          </>
        )}

        {shopOpen && game.status === 'active' && !roomOpen && (
          <ShopModal
            game={game}
            category={shopCategory}
            setCategory={setShopCategory}
            onClose={() => setShopOpen(false)}
            onBuy={buyItem}
          />
        )}

        {roomOpen && game.status === 'active' && (
          <RoomEditor
            game={game}
            selectedFurnitureId={selectedFurnitureId}
            setSelectedFurnitureId={setSelectedFurnitureId}
            onPlace={placeFurniture}
            onUpdate={updateFurniture}
            onRemove={removeFurniture}
            onRoomStyle={updateRoomStyle}
            onFinish={finishRoomLayout}
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

        <div className="prototype-tag">Ver.0.3 PROTOTYPE</div>
      </section>
    </main>
  )
}
