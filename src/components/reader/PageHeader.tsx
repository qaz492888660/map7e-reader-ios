import Icon from './Icon'
export default function PageHeader({
  title,
  onBack,
  note,
  onSettings,
}: {
  title: string
  onBack: () => void
  note?: string
  onSettings?: () => void
}) {
  return (
    <header className="page-header">
      <button
        className="icon-button glass"
        onClick={onBack}
        aria-label="返回"
      >
        <Icon name="back" />
      </button>
      <span>{title}</span>
      {onSettings ? (
        <button
          className="icon-button glass"
          aria-label="设置"
          onClick={onSettings}
        >
          <Icon name="settings" />
        </button>
      ) : (
        <span className="header-note">{note || 'MAP7E'}</span>
      )}
    </header>
  )
}
