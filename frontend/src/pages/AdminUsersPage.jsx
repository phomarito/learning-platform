import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../api/client';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  Edit, 
  Trash2, 
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';

const roles = [
  { value: 'all', label: 'Все роли', color: 'gray' },
  { value: 'ADMIN', label: 'Администраторы', color: 'red' },
  { value: 'TEACHER', label: 'Преподаватели', color: 'blue' },
  { value: 'STUDENT', label: 'Студенты', color: 'green' },
];

const statuses = [
  { value: 'all', label: 'Все', color: 'gray' },
  { value: 'active', label: 'Активные', color: 'green' },
  { value: 'inactive', label: 'Неактивные', color: 'red' },
  { value: 'blocked', label: 'Заблокированные', color: 'yellow' },
];

export default function AdminUsersPage() {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showActions, setShowActions] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    active: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersAPI.getAll();
      const usersData = response.data.data;
      setUsers(usersData);
      
      // Calculate statistics
      const statsData = {
        total: usersData.length,
        admins: usersData.filter(u => u.role === 'ADMIN').length,
        teachers: usersData.filter(u => u.role === 'TEACHER').length,
        students: usersData.filter(u => u.role === 'STUDENT').length,
        active: usersData.filter(u => u.status === 'active').length,
      };
      setStats(statsData);
      
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.id?.toString().includes(search)
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Status filter (example logic)
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => {
        if (selectedStatus === 'active') return user.status === 'active';
        if (selectedStatus === 'inactive') return user.status === 'inactive';
        if (selectedStatus === 'blocked') return user.status === 'blocked';
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Изменить роль пользователя на "${newRole}"?`)) return;

    try {
      await usersAPI.updateRole(userId, { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        admins: newRole === 'ADMIN' ? prev.admins + 1 : prev.admins - 1,
        teachers: newRole === 'TEACHER' ? prev.teachers + 1 : prev.teachers - 1,
        students: newRole === 'STUDENT' ? prev.students + 1 : prev.students - 1,
      }));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Ошибка при изменении роли');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await usersAPI.updateStatus(userId, { status: newStatus });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      await usersAPI.delete(userId);
      setUsers(users.filter(user => user.id !== userId));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        admins: users.find(u => u.id === userId)?.role === 'ADMIN' ? prev.admins - 1 : prev.admins,
        teachers: users.find(u => u.id === userId)?.role === 'TEACHER' ? prev.teachers - 1 : prev.teachers,
        students: users.find(u => u.id === userId)?.role === 'STUDENT' ? prev.students - 1 : prev.students,
      }));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${role === 'ADMIN' ? 'bg-red-100 text-red-800' : ''}
        ${role === 'TEACHER' ? 'bg-blue-100 text-blue-800' : ''}
        ${role === 'STUDENT' ? 'bg-green-100 text-green-800' : ''}
      `}>
        <Shield className="w-3 h-3 mr-1" />
        {roleConfig?.label || role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${status === 'active' ? 'bg-green-100 text-green-800' : ''}
        ${status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${status === 'blocked' ? 'bg-red-100 text-red-800' : ''}
      `}>
        {status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
        {status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
        {status === 'blocked' && <UserX className="w-3 h-3 mr-1" />}
        {status === 'active' && 'Активен'}
        {status === 'inactive' && 'Неактивен'}
        {status === 'blocked' && 'Заблокирован'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-gray-600 mt-1">Всего пользователей: {stats.total}</p>
        </div>

        <button 
          onClick={() => navigate('/admin/users/create')}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Добавить пользователя
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Всего</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          <div className="text-sm text-gray-500">Администраторы</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.teachers}</div>
          <div className="text-sm text-gray-500">Преподаватели</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.students}</div>
          <div className="text-sm text-gray-500">Студенты</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
          <div className="text-sm text-gray-500">Активных</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, email или ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input py-2 pl-3 pr-8 appearance-none bg-white"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input py-2 pl-3 pr-8 appearance-none bg-white"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 font-medium">
              Выбрано пользователей: {selectedUsers.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button className="text-sm text-blue-600 hover:underline">
              Изменить роль
            </button>
            <button className="text-sm text-red-600 hover:underline">
              Удалить выбранных
            </button>
            <button 
              onClick={() => setSelectedUsers([])}
              className="text-sm text-gray-600 hover:underline"
            >
              Снять выделение
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <UserX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Пользователи не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-primary rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'Без имени'}</div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getRoleBadge(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
                        >
                          <option value="STUDENT">Студент</option>
                          <option value="TEACHER">Преподаватель</option>
                          <option value="ADMIN">Администратор</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getStatusBadge(user.status || 'active')}
                        <select
                          value={user.status || 'active'}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
                        >
                          <option value="active">Активен</option>
                          <option value="inactive">Неактивен</option>
                          <option value="blocked">Заблокирован</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.createdAt || new Date())}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button 
                          onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        {showActions === user.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                            <button 
                              onClick={() => {
                                navigate(`/admin/users/${user.id}`);
                                setShowActions(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4" />
                              Просмотр
                            </button>
                            <button 
                              onClick={() => {
                                navigate(`/admin/users/${user.id}/edit`);
                                setShowActions(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              Редактировать
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button 
                              onClick={() => {
                                handleDeleteUser(user.id);
                                setShowActions(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Показано {filteredUsers.length} из {users.length} пользователей
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                ← Назад
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">Страница 1</span>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Распределение по ролям</h3>
          <div className="space-y-3">
            {roles.filter(r => r.value !== 'all').map(role => (
              <div key={role.value} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    role.value === 'ADMIN' ? 'bg-red-500' :
                    role.value === 'TEACHER' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-gray-700">{role.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    {stats[role.value.toLowerCase() + 's'] || 0}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Math.round((stats[role.value.toLowerCase() + 's'] / stats.total) * 100 || 0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/admin/users/import')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="text-gray-900 font-medium">Импорт пользователей</div>
              <div className="text-sm text-gray-500">Из CSV/Excel</div>
            </button>
            <button 
              onClick={() => navigate('/admin/users/export')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="text-gray-900 font-medium">Экспорт данных</div>
              <div className="text-sm text-gray-500">В CSV формат</div>
            </button>
            <button 
              onClick={() => navigate('/admin/users/bulk-edit')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="text-gray-900 font-medium">Массовое редактирование</div>
              <div className="text-sm text-gray-500">Роли и статусы</div>
            </button>
            <button 
              onClick={() => navigate('/admin/users/reports')}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="text-gray-900 font-medium">Отчёты</div>
              <div className="text-sm text-gray-500">Статистика активности</div>
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}