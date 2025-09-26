import useAccess from '../hooks/useAccess';

const menuItems = [
  { path: '/', label: 'Home', guest: true },
  { path: '/food-ordering', label: '🍽️ Food Ordering', guest: true },
  { path: '/menu', label: '📋 Restaurant Menu', guest: true },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/staff-portal', label: 'Staff Portal', roles: ['staff', 'manager'] },
  { path: '/admin/users', label: 'User Management', permissions: ['manage-users'] }
];

export default function NavMenu() {
  const { canView } = useAccess();

  const filteredItems = menuItems.filter(item => 
    canView({ 
      roles: item.roles, 
      permissions: item.permissions, 
      allowGuest: item.guest 
    })
  );

  return (
    <nav>
      <ul>
        {filteredItems.map(item => (
          <li key={item.path}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}