type DashboardCardProps = {
  title: string
  value: string
}

function DashboardCard({ title, value }: DashboardCardProps) {
  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <strong>{value}</strong>
    </div>
  )
}

export default DashboardCard