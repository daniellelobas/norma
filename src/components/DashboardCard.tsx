
type DashboardCardProps = {
  title: string
  value: string
  icon?: string
  description?: string
  variant?: 'purple' | 'green' | 'red' | 'blue'
}

function DashboardCard({
  title,
  value,
  icon,
  description,
  variant = 'purple',
}: DashboardCardProps) {
  return (
    <article className={`dashboard-card dashboard-card-${variant}`}>
      <div className="dashboard-card-top">
        <h3>{title}</h3>
        {icon && (
          <span className="dashboard-card-icon">{icon}</span>
        )}
      </div>

      <strong>{value}</strong>

      {description && (
        <small>{description}</small>
      )}
    </article>
  )
}

export default DashboardCard
