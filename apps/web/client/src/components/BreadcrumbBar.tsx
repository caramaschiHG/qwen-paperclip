import { useLocation, Link } from 'react-router-dom';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/agents': 'Team',
  '/approvals': 'Approvals',
  '/org-chart': 'Org Chart',
  '/companies': 'Companies',
  '/logs': 'Logs',
  '/settings': 'Settings',
};

export function BreadcrumbBar() {
  const location = useLocation();
  const path = location.pathname;
  const segments = path.split('/').filter(Boolean);

  const breadcrumbs = [
    { label: 'Home', to: '/' },
    ...segments.map((seg, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      return {
        label: routeLabels[href] || seg,
        to: href,
      };
    }),
  ];

  // If single item, show uppercase bold
  if (breadcrumbs.length === 1) {
    return (
      <div className="h-12 flex items-center px-4 md:px-6 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-wide">
          {breadcrumbs[0].label}
        </span>
      </div>
    );
  }

  return (
    <div className="h-12 flex items-center px-4 md:px-6 border-b border-border gap-1">
      {breadcrumbs.map((crumb, i) => (
        <div key={crumb.to} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground text-xs">/</span>}
          <Link
            to={crumb.to}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {i === breadcrumbs.length - 1 ? (
              <span className="font-bold uppercase tracking-wide">{crumb.label}</span>
            ) : (
              crumb.label
            )}
          </Link>
        </div>
      ))}
    </div>
  );
}
