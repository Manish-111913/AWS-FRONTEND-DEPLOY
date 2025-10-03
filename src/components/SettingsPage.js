import React, { useEffect, useState, useMemo } from 'react';
import './SettingsPage.css';
import WastageService from '../services/wastageService';
import authService from '../services/authService';
import UserService from '../services/userService';
import RoleService from '../services/roleService';
import SettingsService from '../services/settingsService';
import InventoryCategoriesService from '../services/inventoryCategoriesService';

// Import icons from a React icon library (you may need to install one like react-icons)
import { 
  FaUser, FaBuilding, FaBox, FaShoppingCart, FaTruck, FaTrash, 
  FaUsers, FaQuestionCircle, FaChevronRight, FaChevronDown, 
  FaChevronUp, FaCog, FaBell, FaTimes, FaSearch, FaUserPlus
} from 'react-icons/fa';

const SettingsPage = ({ goTo, currentUser, setCurrentUser, onNavigateToUnits }) => {
  
  const [expandedSections, setExpandedSections] = useState(['account', 'inventory']);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [showRolePermissionsModal, setShowRolePermissionsModal] = useState(false);
  const [showWastageReasonsModal, setShowWastageReasonsModal] = useState(false);
  const [showDeviationModal, setShowDeviationModal] = useState(false);
  const [showOperatingHoursModal, setShowOperatingHoursModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [deviation, setDeviation] = useState(5);
  const businessId = currentUser?.businessId || currentUser?.business_id || 1;

  // Load persisted business settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await SettingsService.getSettings(businessId, ['app.language', 'vendors.default_payment_terms_days', 'wastage.yield_tolerance_pct']);
        const map = Object.fromEntries((res.data || []).map(s => [s.key, s.value]));
        if (map['app.language']) setSelectedLanguage(map['app.language']);
        if (map['vendors.default_payment_terms_days']) setPaymentTermDays(Number(map['vendors.default_payment_terms_days']));
        if (map['wastage.yield_tolerance_pct']) setDeviation(Number(map['wastage.yield_tolerance_pct']));
      } catch (e) { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const [notificationSettings, setNotificationSettings] = useState({
    stockAlerts: true,
    transactionAlerts: true,
    systemUpdates: false,
    salesBoosterAlerts: true,
  });

  const [inviteUserData, setInviteUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    locations: [],
  });

  const [toggleStates, setToggleStates] = useState({
    // Keys must match item.id values used below
    'pricing-control': false,
    'two-factor-auth': true,
  });

  const [rolePermissionStates, setRolePermissionStates] = useState({});

  // Wastage reasons state
  const [wastageReasons, setWastageReasons] = useState([]);
  const [newReasonLabel, setNewReasonLabel] = useState('');
  const [newReasonCategory, setNewReasonCategory] = useState('General Waste');

  // Operating hours state
  const [operatingHours, setOperatingHours] = useState({
    Monday: { 
      isOpen: true, 
      shifts: {
        morning: { enabled: true, start: '9:00 AM', end: '12:00 PM' },
        afternoon: { enabled: false, start: '1:00 PM', end: '5:00 PM' },
        evening: { enabled: false, start: '6:00 PM', end: '10:00 PM' }
      }
    },
    Tuesday: { 
      isOpen: true, 
      shifts: {
        morning: { enabled: true, start: '9:00 AM', end: '12:00 PM' },
        afternoon: { enabled: false, start: '1:00 PM', end: '5:00 PM' },
        evening: { enabled: false, start: '6:00 PM', end: '10:00 PM' }
      }
    },
    Wednesday: { 
      isOpen: true, 
      shifts: {
        morning: { enabled: true, start: '9:00 AM', end: '12:00 PM' },
        afternoon: { enabled: false, start: '1:00 PM', end: '5:00 PM' },
        evening: { enabled: false, start: '6:00 PM', end: '10:00 PM' }
      }
    },
    Thursday: { 
      isOpen: true, 
      shifts: {
        morning: { enabled: true, start: '9:00 AM', end: '12:00 PM' },
        afternoon: { enabled: false, start: '1:00 PM', end: '5:00 PM' },
        evening: { enabled: false, start: '6:00 PM', end: '10:00 PM' }
      }
    },
    Friday: { 
      isOpen: true, 
      shifts: {
        morning: { enabled: true, start: '9:00 AM', end: '12:00 PM' },
        afternoon: { enabled: false, start: '1:00 PM', end: '5:00 PM' },
        evening: { enabled: false, start: '6:00 PM', end: '10:00 PM' }
      }
    },
    Saturday: { 
      isOpen: true, 
      shifts: {
        morning: { enabled: true, start: '9:00 AM', end: '12:00 PM' },
        afternoon: { enabled: false, start: '1:00 PM', end: '5:00 PM' },
        evening: { enabled: false, start: '6:00 PM', end: '10:00 PM' }
      }
    },
    Sunday: { 
      isOpen: false, 
      shifts: {
        morning: { enabled: false, start: '9:00 AM', end: '12:00 PM' },
        afternoon: { enabled: false, start: '1:00 PM', end: '5:00 PM' },
        evening: { enabled: false, start: '6:00 PM', end: '10:00 PM' }
      }
    }
  });

  // Edit Profile modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

  // Initialize profile form with current user data
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.fullName || currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
  }, [currentUser]);

  // Payment Methods modal state
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'cash', label: 'Cash' },
    { id: 'upi', label: 'UPI' },
    { id: 'card', label: 'Card' },
  ]);
  const [newPaymentLabel, setNewPaymentLabel] = useState('');
  
  
  // Default Payment Terms modal state
  const [showPaymentTermsModal, setShowPaymentTermsModal] = useState(false);
  const [paymentTermDays, setPaymentTermDays] = useState(7);

  // Inventory Categories modal state (was UI-only) -> load list when open
  const [showInventoryCategoriesModal, setShowInventoryCategoriesModal] = useState(false);
  const [inventoryCategories, setInventoryCategories] = useState([
    'Produce', 'Dairy', 'Meat', 'Dry Goods', 'Beverages', 'Packaging'
  ]);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  useEffect(() => {
    if (!showInventoryCategoriesModal) return;
    (async () => {
      try {
        const res = await InventoryCategoriesService.list(businessId);
        setInventoryCategories((res.data || []).map(c => c.name));
      } catch (e) { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInventoryCategoriesModal]);

  // Change Password modal state (verify old password via backend)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePwdStep, setChangePwdStep] = useState(1); // 1: old, 2: new
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Manage Users: role change modal (UI-only)
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [roleChangeMode, setRoleChangeMode] = useState('promote'); // 'promote' | 'demote'
  const [targetUser, setTargetUser] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [rolesError, setRolesError] = useState(null);

  useEffect(() => {
    const loadReasons = async () => {
      try {
        const res = await WastageService.getWastageReasons(1);
        setWastageReasons(res.data || []);
      } catch (e) {
        console.error('Failed to load wastage reasons:', e);
      }
    };
    if (showWastageReasonsModal) loadReasons();
  }, [showWastageReasonsModal]);

  const languages = ['English', 'Hindi', 'Telugu'];
  
  // Load roles from backend
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await RoleService.listRoles(businessId);
        const roleNames = (res.data || []).map(r => r.role_name);
        setAllRoles(res.data || []);
        setRoles(roleNames);
      } catch (e) {
        console.error('Failed to load roles:', e);
        setRolesError(e.message || 'Failed to load roles');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locations = [
    'Jubilee Hills',
    'Gachibowli', 
    'Banjara Hills',
    'Hitech City',
    'Kondapur'
  ];

  // Users state (live from backend)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // Load notification preferences
  useEffect(() => {
    const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
    if (!userId) return;
    (async () => {
      try {
        const prefs = await SettingsService.getNotificationPreferences(businessId, userId);
        const map = {};
        (prefs.data || []).forEach(p => { map[p.alert_type] = !!p.is_enabled; });
        setNotificationSettings(prev => ({
          ...prev,
          stockAlerts: map['stockAlerts'] ?? prev.stockAlerts,
          transactionAlerts: map['transactionAlerts'] ?? prev.transactionAlerts,
          systemUpdates: map['systemUpdates'] ?? prev.systemUpdates,
          salesBoosterAlerts: map['salesBoosterAlerts'] ?? prev.salesBoosterAlerts,
        }));
      } catch (e) { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Helpers
  const formatRelativeTime = (ts) => {
    if (!ts) return 'Never';
    const d = new Date(ts);
    if (isNaN(d)) return 'Unknown';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const mapServerUser = (u) => {
    const status = u.is_active ? (u.last_login_at ? 'Active' : 'Pending') : 'Inactive';
    return {
      id: String(u.user_id),
      name: u.name || 'Unnamed',
      email: u.email || '',
      role: u.role_name || 'Staff',
      location: 'All Locations',
      lastActive: formatRelativeTime(u.last_login_at || u.created_at),
      status
    };
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await UserService.getUsers(businessId);
      const rows = Array.isArray(res.data) ? res.data : [];
      setUsers(rows.map(mapServerUser));
    } catch (e) {
      console.error('Failed to load users:', e);
      setUsersError(e.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load once on mount for counts, and refresh whenever the modal opens
  useEffect(() => { loadUsers(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (showUserManagementModal) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUserManagementModal]);

  const permissions = {
    'Dashboard Access': ['View Dashboard', 'View Analytics'],
    'Inventory Management': ['View Inventory', 'Create Stock-In', 'Edit Items', 'Delete Items', 'Manage Master Data'],
    'Sales Management': ['View Sales', 'Create Sales', 'Edit Sales', 'Delete Sales', 'View Profit Reports'],
    'Wastage Management': ['View Wastage', 'Log Wastage', 'Edit Wastage', 'Delete Wastage'],
    'Vendor Management': ['View Vendors', 'Create Vendors', 'Edit Vendors', 'Delete Vendors', 'Approve POs'],
    'Reports Access': ['View Basic Reports', 'View Financial Reports', 'Export Reports'],
    'Production Planning': ['View Production', 'Create Production Plans', 'Edit Production', 'Approve Production'],
    'Settings Access': ['View Settings', 'Edit Basic Settings', 'Manage Users', 'System Configuration']
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleInviteUser = async () => {
    try {
      if (!inviteUserData.name || !inviteUserData.email || !inviteUserData.role) {
        alert('Please fill in all required fields');
        return;
      }

      // Map role name -> role_id
      const roleObj = allRoles.find(r => r.role_name === inviteUserData.role);
      if (!roleObj) {
        alert('Selected role not found. Please choose a valid role.');
        return;
      }

      const payload = {
        name: inviteUserData.name.trim(),
        email: inviteUserData.email.trim(),
        phone_number: (inviteUserData.phone || '').trim() || null,
        role_id: roleObj.role_id,
        business_id: businessId
      };

      const res = await UserService.createUser(payload);
      if (!res || res.success !== true) throw new Error(res?.error || 'Failed to create user');

      // Refresh users list and close modal
      await loadUsers();
      alert(`User created: ${payload.email}`);
      setShowInviteUserModal(false);
      setInviteUserData({ name: '', email: '', phone: '', role: '', locations: [] });
    } catch (err) {
      alert(err.message || 'Failed to invite user');
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!profileForm.name || !profileForm.email) {
        alert('Name and email are required');
        return;
      }

      // Update profile via authService
      const updatedUser = await authService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone_number: profileForm.phone
      });

      // Update the current user in App state
      if (setCurrentUser && updatedUser.user) {
        setCurrentUser(updatedUser.user);
      }

      alert('Profile updated successfully!');
      setShowEditProfileModal(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        alert('Please fill both password fields');
        return;
      }

      if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
      }

      // Change password via authService
      await authService.changePassword(oldPassword, newPassword);

      alert('Password changed successfully!');
      setShowChangePasswordModal(false);
      setChangePwdStep(1);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change failed:', error);
      alert(error.message || 'Failed to change password. Please try again.');
    }
  };

  // Persisted setting handlers
  const onSelectLanguage = async (language) => {
    setSelectedLanguage(language);
    setShowLanguageModal(false);
    try {
      await SettingsService.upsertSettings(businessId, [{ key: 'app.language', value: language, data_type: 'string', module_scope: 'app' }]);
    } catch (e) {
      alert(e.message || 'Failed to save language');
    }
  };

  const onSelectPaymentTerm = async (days) => {
    setPaymentTermDays(days);
    setShowPaymentTermsModal(false);
    try {
      await SettingsService.upsertSettings(businessId, [{ key: 'vendors.default_payment_terms_days', value: days, data_type: 'number', module_scope: 'vendors' }]);
    } catch (e) {
      alert(e.message || 'Failed to save default payment terms');
    }
  };

  const onSelectDeviation = async (pct) => {
    setDeviation(pct);
    setShowDeviationModal(false);
    try {
      await SettingsService.upsertSettings(businessId, [{ key: 'wastage.yield_tolerance_pct', value: pct, data_type: 'number', module_scope: 'wastage' }]);
    } catch (e) {
      alert(e.message || 'Failed to save tolerance');
    }
  };

  // After notificationSettings useState initialization, add effect to load prefs
  useEffect(() => {
    const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
    if (!userId) return;
    (async () => {
      try {
        const prefs = await SettingsService.getNotificationPreferences(businessId, userId);
        const map = {};
        (prefs.data || []).forEach(p => { map[p.alert_type] = !!p.is_enabled; });
        setNotificationSettings(prev => ({
          ...prev,
          stockAlerts: map['stockAlerts'] ?? prev.stockAlerts,
          transactionAlerts: map['transactionAlerts'] ?? prev.transactionAlerts,
          systemUpdates: map['systemUpdates'] ?? prev.systemUpdates,
          salesBoosterAlerts: map['salesBoosterAlerts'] ?? prev.salesBoosterAlerts,
        }));
      } catch (e) { /* silent */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleNotificationToggle = async (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    try {
      const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
      if (!userId) return;
      await SettingsService.updateNotificationPreferences(businessId, userId, { [key]: value });
    } catch (e) {
      // revert on failure
      setNotificationSettings(prev => ({ ...prev, [key]: !value }));
      alert(e.message || 'Failed to update notification preference');
    }
  };

  // Operating hours helper functions
  const toggleDayStatus = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen
      }
    }));
  };

  const enableShift = (day, shiftName) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: {
          ...prev[day].shifts,
          [shiftName]: {
            ...prev[day].shifts[shiftName],
            enabled: true
          }
        }
      }
    }));
  };

  const disableShift = (day, shiftName) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: {
          ...prev[day].shifts,
          [shiftName]: {
            ...prev[day].shifts[shiftName],
            enabled: false
          }
        }
      }
    }));
  };

  const updateShiftTime = (day, shiftName, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: {
          ...prev[day].shifts,
          [shiftName]: {
            ...prev[day].shifts[shiftName],
            [field]: value
          }
        }
      }
    }));
  };

  // Load payment methods from backend when modal opens
  useEffect(() => {
    if (!showPaymentMethodsModal) return;
    (async () => {
      try {
        const res = await SettingsService.listPaymentMethods(businessId);
        const list = (res.data || []).map(pm => ({ id: String(pm.payment_method_id), label: pm.method_name, description: pm.description }));
        setPaymentMethods(list);
      } catch (e) {
        console.error('Failed to load payment methods', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaymentMethodsModal]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Priority 1: Name starts with search term
    const nameStartsWithMatches = users.filter(user =>
      (user.name || '').toLowerCase().startsWith(searchLower)
    );
    
    // Priority 2: Email starts with search term (but name doesn't start with it)
    const emailStartsWithMatches = users.filter(user =>
      !(user.name || '').toLowerCase().startsWith(searchLower) &&
      (user.email || '').toLowerCase().startsWith(searchLower)
    );
    
    // Priority 3: Role starts with search term (but name and email don't start with it)
    const roleStartsWithMatches = users.filter(user =>
      !(user.name || '').toLowerCase().startsWith(searchLower) &&
      !(user.email || '').toLowerCase().startsWith(searchLower) &&
      (user.role || '').toLowerCase().startsWith(searchLower)
    );
    
    // Priority 4: Contains search term in name (but doesn't start with it)
    const nameContainsMatches = users.filter(user =>
      (user.name || '').toLowerCase().includes(searchLower) &&
      !(user.name || '').toLowerCase().startsWith(searchLower)
    );
    
    // Priority 5: Contains search term in email (but doesn't start with it and name doesn't match)
    const emailContainsMatches = users.filter(user =>
      !(user.name || '').toLowerCase().includes(searchLower) &&
      (user.email || '').toLowerCase().includes(searchLower) &&
      !(user.email || '').toLowerCase().startsWith(searchLower)
    );
    
    // Priority 6: Contains search term in role (but others don't match)
    const roleContainsMatches = users.filter(user =>
      !(user.name || '').toLowerCase().includes(searchLower) &&
      !(user.email || '').toLowerCase().includes(searchLower) &&
      (user.role || '').toLowerCase().includes(searchLower) &&
      !(user.role || '').toLowerCase().startsWith(searchLower)
    );
    
    return [
      ...nameStartsWithMatches,
      ...emailStartsWithMatches,
      ...roleStartsWithMatches,
      ...nameContainsMatches,
      ...emailContainsMatches,
      ...roleContainsMatches
    ];
  }, [users, searchQuery]);

  const settingSections = [
    {
      id: 'account',
      title: 'My Account & Profile',
      icon: <FaUser />,
      expanded: expandedSections.includes('account'),
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          subtitle: 'Update name, email, phone number',
          type: 'navigation',
          action: () => {
            // Reset form with current user data when opening modal
            if (currentUser) {
              setProfileForm({
                name: currentUser.fullName || currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || ''
              });
            }
            setShowEditProfileModal(true);
          },
        },
        {
          id: 'change-password',
          title: 'Change Password',
          subtitle: 'Update your account password',
          type: 'navigation',
          action: () => { setChangePwdStep(1); setShowChangePasswordModal(true); },
        },
        {
          id: 'language',
          title: 'App Language',
          subtitle: selectedLanguage,
          type: 'button',
          action: () => setShowLanguageModal(true),
        },
        {
          id: 'logout',
          title: 'Sign Out',
          subtitle: 'Log out of your account',
          type: 'navigation',
          action: () => {
            authService.logout();
            setCurrentUser(null);
            goTo('login');
          },
        },
      ],
    },
    {
      id: 'users',
      title: 'User & Access Management',
      icon: <FaUsers />,
      expanded: expandedSections.includes('users'),
      items: [
        {
          id: 'manage-users',
          title: 'Manage Users',
          subtitle: `${users.length} total users (${users.filter(u => u.status === 'Active').length} active)`,
          type: 'navigation',
          action: () => setShowUserManagementModal(true),
        },
        {
          id: 'invite-user',
          title: 'Invite New User',
          subtitle: 'Send invitation to new team member',
          type: 'navigation',
          action: () => setShowInviteUserModal(true),
        },
        {
          id: 'roles-permissions',
          title: 'Roles & Permissions',
          subtitle: `${roles.length} roles configured`,
          type: 'navigation',
          action: () => setShowRolePermissionsModal(true),
        },
        {
          id: 'location-assignment',
          title: 'Location Assignment',
          subtitle: 'Assign users to specific branches',
          type: 'navigation',
          action: () => alert('Manage user location access'),
        },
        {
          id: 'two-factor-auth',
          title: 'Two-Factor Authentication',
          subtitle: 'Enhanced security for admin roles',
          type: 'toggle',
          value: true,
        },
        {
          id: 'activity-logs',
          title: 'Activity Logs',
          subtitle: 'View user actions and audit trail',
          type: 'navigation',
          action: () => alert('View comprehensive user activity logs'),
        },
      ],
    },
    {
      id: 'business',
      title: 'Business & Location Management',
      icon: <FaBuilding />,
      expanded: expandedSections.includes('business'),
      items: [
        {
          id: 'business-profile',
          title: 'Restaurant Profile',
          subtitle: 'Business name, address, contact details',
          type: 'navigation',
          action: () => alert('Navigate to business profile screen'),
        },
        {
          id: 'manage-locations',
          title: 'Manage Locations',
          subtitle: `${locations.length} active branches`,
          type: 'navigation',
          action: () => alert('Navigate to locations management'),
        },
        {
          id: 'operating-hours',
          title: 'Operating Hours',
          subtitle: 'Configure business shifts',
          type: 'navigation',
          action: () => setShowOperatingHoursModal(true),
        },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      icon: <FaBox />,
      expanded: expandedSections.includes('inventory'),
      items: [
        {
          id: 'units-measure',
          title: 'Units of Measure',
          subtitle: 'Manage KG, L, Pieces, Plates',
          type: 'navigation',
          action: () => (onNavigateToUnits ? onNavigateToUnits() : (goTo && goTo('map1'))),
        },
        {
          id: 'reorder-defaults',
          title: 'Reorder Point Defaults',
          subtitle: 'Set automatic reorder rules',
          type: 'navigation',
          action: () => alert('Configure reorder points'),
        },
        {
          id: 'inventory-categories',
          title: 'Inventory Categories',
          subtitle: 'Produce, Dairy, Meat, Dry Goods',
          type: 'navigation',
          action: () => setShowInventoryCategoriesModal(true),
        },
      ],
    },
    {
      id: 'sales',
      subtitle: `${users.length} total users (${users.filter(u => u.status === 'Active').length} active)`,
      title: 'Sales & Menu Management',
      icon: <FaShoppingCart />,
      expanded: expandedSections.includes('sales'),
      items: [
        {
          id: 'menu-categories',
          title: 'Menu Categories',
          subtitle: 'Breakfast, Lunch, Beverages',
          type: 'navigation',
          action: () => alert('Manage menu categories'),
        },
        {
          id: 'tax-rates',
          title: 'Tax Rates',
          subtitle: 'GST/VAT configuration',
          type: 'navigation',
          action: () => alert('Configure tax rates'),
        },
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          subtitle: 'Cash, UPI, Card, Wallets',
          type: 'navigation',
          action: () => setShowPaymentMethodsModal(true),
        },
        {
          id: 'pricing-control',
          title: 'Localized Pricing',
          subtitle: 'Allow branch-specific pricing',
          type: 'toggle',
          value: false,
        },
      ],
    },
    {
      id: 'vendors',
      title: 'Vendor & Procurement',
      icon: <FaTruck />,
      expanded: expandedSections.includes('vendors'),
      items: [
        {
          id: 'manage-vendors',
          title: 'Manage Vendors',
          subtitle: '12 active suppliers',
          type: 'navigation',
          action: () => goTo && goTo('vendors'),
        },
        {
          id: 'payment-terms',
          title: 'Default Payment Terms',
          subtitle: `Net ${paymentTermDays} Days`,
          type: 'navigation',
          action: () => setShowPaymentTermsModal(true),
        },
      ],
    },
    {
      id: 'wastage',
      title: 'Wastage & Production',
      icon: <FaTrash />,
      expanded: expandedSections.includes('wastage'),
      items: [
        {
          id: 'wastage-reasons',
          title: 'Wastage Reasons',
          subtitle: 'Expired, Spillage, Overcooked',
          type: 'navigation',
          action: () => setShowWastageReasonsModal(true),
        },
        {
          id: 'yield-tolerances',
          title: 'Production Yield Tolerances',
          subtitle: `Alert at ${deviation}% deviation`,
          type: 'navigation',
          action: () => setShowDeviationModal(true),
        },
      ],
    },
    {
      id: 'support',
      title: 'App Information & Support',
      icon: <FaQuestionCircle />,
      expanded: expandedSections.includes('support'),
      items: [
        {
          id: 'help-support',
          title: 'Help & Support',
          subtitle: 'FAQ, Contact, Tutorials',
          type: 'navigation',
          action: () => alert('Access help resources'),
        },
        {
          id: 'about',
          title: 'About Invexis',
          subtitle: 'Version 1.2.3',
          type: 'navigation',
          action: () => alert('App version and legal information'),
        },
      ],
    },
  ];

  const togglePermission = (role, category, permission) => {
    const permissionKey = `${role}-${category}-${permission}`;
    setRolePermissionStates(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const renderSettingItem = (item) => {
    switch (item.type) {
      case 'toggle':
        return (
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">{item.title}</div>
              {item.subtitle && (
                <div className="setting-subtitle">{item.subtitle}</div>
              )}
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={!!toggleStates[item.id]}
                onChange={() => {
                  const next = !toggleStates[item.id];
                  handleToggle(item.id);
                  // You can also trigger additional actions here
                  alert(`${item.title} ${next ? 'enabled' : 'disabled'}`);
                }}
              />
              <span className="slider round"></span>
            </label>
          </div>
        );

      case 'navigation':
      case 'button':
        return (
          <div 
            className="setting-item clickable"
            onClick={item.action}
          >
            <div className="setting-info">
              <div className="setting-title">{item.title}</div>
              {item.subtitle && (
                <div className="setting-subtitle">{item.subtitle}</div>
              )}
            </div>
            <FaChevronRight className="chevron-icon" />
          </div>
        );

      default:
        return null;
    }
  };

  const renderUserRow = (user) => (
    <div key={user.id} className="user-row">
      <div className="user-info">
        <div className="user-name">{user.name}</div>
        <div className="user-email">{user.email}</div>
        <div className="user-meta">
          <span className="user-role">{user.role}</span>
          <span className="user-location">• {user.location}</span>
        </div>
        <div className="user-last-active">Last active: {user.lastActive}</div>
      </div>
      
      <div className="user-actions">
        <div className={`status-badge ${user.status.toLowerCase()}`}>
          {user.status}
        </div>
        
        <div className="action-buttons">
      <button
            className="action-button"
            onClick={() => {
        const idx = roles.indexOf(user.role);
        const opts = roles.slice(0, Math.max(idx, 0));
        setRoleOptions(opts);
              setTargetUser(user);
              setRoleChangeMode('promote');
              setShowRoleChangeModal(true);
            }}
          >Promote</button>
          <button
            className="action-button"
            onClick={() => {
        const idx = roles.indexOf(user.role);
        const opts = idx >= 0 ? roles.slice(idx + 1) : [];
        setRoleOptions(opts);
              setTargetUser(user);
              setRoleChangeMode('demote');
              setShowRoleChangeModal(true);
            }}
          >Demote</button>
        </div>
      </div>
    </div>
  );

  const handleToggle = (toggleId) => {
    setToggleStates(prev => {
      const newState = {
        ...prev,
        [toggleId]: !prev[toggleId]
      };
      console.log(`Toggle ${toggleId}:`, newState[toggleId]); // For debugging
      return newState;
    });
  };

  const handleAddInventoryCategory = async (name) => {
    if (!name?.trim()) return;
    try {
      const res = await InventoryCategoriesService.add(businessId, name.trim());
      const created = res.data && (res.data.name || name.trim());
      setInventoryCategories(prev => prev.includes(created) ? prev : [...prev, created]);
    } catch (e) { /* ignore */ }
  };

  const handleDeleteInventoryCategory = async (name) => {
    try {
      // Fetch server list to find id by name, then delete
      const res = await InventoryCategoriesService.list(businessId);
  const match = (res.data || []).find(c => c.name === name);
      if (!match) return;
  await InventoryCategoriesService.remove(match.category_id);
      setInventoryCategories(prev => prev.filter(c => c !== name));
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <div className="header-title-container">
          <FaCog className="header-icon" />
          <h1 className="header-title">Settings</h1>
        </div>
      </div>

  <div className="settings-content">
        {/* Notification Preferences Card */}
        <div className="notification-card">
          <div className="notification-header">
            <FaBell className="notification-icon" />
            <h2 className="notification-title">Notification Preferences</h2>
          </div>
          
          <div className="notification-item">
            <div className="notification-label">Critical Stock Alerts</div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.stockAlerts} 
                onChange={(e) => handleNotificationToggle('stockAlerts', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
          
          <div className="notification-item">
            <div className="notification-label">High-Value Transactions</div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.transactionAlerts} 
                onChange={(e) => handleNotificationToggle('transactionAlerts', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
          
          <div className="notification-item">
            <div className="notification-label">System Updates</div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.systemUpdates} 
                onChange={(e) => handleNotificationToggle('systemUpdates', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <div key={section.id || section.title} className="section-card">
            <div
              className="section-header"
              onClick={() => toggleSection(section.id || section.title)}
            >
              <div className="section-title-container">
                <span className="section-icon">{section.icon}</span>
                <h3 className="section-title">{section.title}</h3>
              </div>
              {section.expanded ? (
                <FaChevronUp className="chevron-icon" />
              ) : (
                <FaChevronDown className="chevron-icon" />
              )}
            </div>

            {section.expanded && (
              <div className="section-content">
                {section.items.map((item) => (
                  <div key={item.id}>
                    {renderSettingItem(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Select Language</h2>
              <button className="sp-close-button" onClick={() => setShowLanguageModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="sp-modal-content">
              {languages.map((language) => (
                <div
                  key={language}
                  className={`language-option ${selectedLanguage === language ? 'selected' : ''}`}
                  onClick={() => onSelectLanguage(language)}
                >
                  <span className="language-text">{language}</span>
                  {selectedLanguage === language && (
                    <div className="selected-indicator"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal (UI only) */}
      {showEditProfileModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Edit Profile</h2>
              <button className="sp-close-button" onClick={() => setShowEditProfileModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              <div className="form-section">
                <label className="form-label" style={{textAlign:'left', paddingLeft:'1rem'}}>Name</label>
                <input className="form-input" value={profileForm.name} onChange={e => setProfileForm(prev => ({...prev, name: e.target.value}))} placeholder="Enter your name" />
              </div>
              <div className="form-section">
                <label className="form-label" style={{textAlign:'left', paddingLeft:'1rem'}}>Email</label>
                <input className="form-input" value={profileForm.email} onChange={e => setProfileForm(prev => ({...prev, email: e.target.value}))} placeholder="Enter your email" type="email" />
              </div>
              <div className="form-section">
                <label className="form-label" style={{textAlign:'left', paddingLeft:'1rem'}}>Phone</label>
                <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm(prev => ({...prev, phone: e.target.value}))} placeholder="Enter your phone" type="tel" />
              </div>
              <div className="modal-actions">
                <button className="modal-action-button secondary" onClick={() => setShowEditProfileModal(false)}>Cancel</button>
                <button className="modal-action-button primary" onClick={handleSaveProfile}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentMethodsModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Payment Methods</h2>
              <button className="sp-close-button" onClick={() => setShowPaymentMethodsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              <div className="form-section" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">New Method</label>
                  <input className="form-input" value={newPaymentLabel} onChange={e => setNewPaymentLabel(e.target.value)} placeholder="e.g., Wallets" />
                </div>
                <button className="invite-button" style={{ maxWidth: 160 }} onClick={async () => {
                  const label = newPaymentLabel.trim();
                  if (!label) return;
                  try {
                    const res = await SettingsService.addPaymentMethod(businessId, { method_name: label });
                    const pm = res.data;
                    // prevent dupes locally
                    setPaymentMethods(prev => prev.some(p => p.id === String(pm.payment_method_id)) ? prev : [...prev, { id: String(pm.payment_method_id), label: pm.method_name }]);
                    setNewPaymentLabel('');
                  } catch (e) {
                    alert(e.message || 'Failed to add payment method');
                  }
                }}>Add</button>
              </div>

              <div className="payments-list">
                {paymentMethods.map(pm => (
                  <div key={pm.id} className="user-row">
                    <div className="user-info">
                      <div className="user-name">{pm.label}</div>
                      <div className="user-meta"><span className="user-role">Method ID: {pm.id}</span></div>
                    </div>
                    <div className="user-actions">
                      <button className="action-button" onClick={async () => {
                        try {
                          await SettingsService.deletePaymentMethod(pm.id);
                          setPaymentMethods(prev => prev.filter(p => p.id !== pm.id));
                        } catch (e) {
                          alert(e.message || 'Failed to delete payment method');
                        }
                      }}>
                        <FaTrash className="action-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: 12, color: '#666' }}>Changes are saved for this business.</div>
            </div>
          </div>
        </div>
      )}
      {/* User Management Modal */}
      {showUserManagementModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container full-screen">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Manage Users</h2>
              <button className="sp-close-button" onClick={() => setShowUserManagementModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="user-management-content">
              {/* Search and Add User */}
              <div className="user-management-actions">
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    className="search-input"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  className="add-user-button"
                  onClick={() => {
                    setShowUserManagementModal(false);
                    setShowInviteUserModal(true);
                  }}
                >
                  <FaUserPlus />
                </button>
              </div>

              {/* Users List */}
              <div className="users-list">
                {usersLoading && (
                  <div style={{ padding: 16, color: '#6b7280' }}>Loading users…</div>
                )}
                {usersError && !usersLoading && (
                  <div style={{ padding: 16, color: '#dc2626' }}>Failed to load users: {usersError}</div>
                )}
                {!usersLoading && !usersError && filteredUsers.length === 0 && (
                  <div style={{ padding: 16, color: '#6b7280' }}>No users found.</div>
                )}
                {!usersLoading && !usersError && filteredUsers.map(renderUserRow)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteUserModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Invite New User</h2>
              <button className="sp-close-button" onClick={() => setShowInviteUserModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="sp-modal-content">
              <div className="form-section">
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  value={inviteUserData.name}
                  onChange={(e) => setInviteUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-section">
                <label className="form-label">Email Address *</label>
                <input
                  className="form-input"
                  value={inviteUserData.email}
                  onChange={(e) => setInviteUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  type="email"
                />
              </div>

              <div className="form-section">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  value={inviteUserData.phone}
                  onChange={(e) => setInviteUserData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  type="tel"
                />
              </div>

              <div className="form-section">
                <label className="form-label">Role *</label>
                <div className="role-grid">
                  {roles.map((role) => (
                    <div
                      key={role}
                      className={`role-option ${inviteUserData.role === role ? 'selected' : ''}`}
                      onClick={() => setInviteUserData(prev => ({ ...prev, role }))}
                    >
                      <span className="role-option-text">{role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Location Access</label>
                <div className="location-grid">
                  <div
                    className={`location-option ${inviteUserData.locations.includes('All Locations') ? 'selected' : ''}`}
                    onClick={() => {
                      if (inviteUserData.locations.includes('All Locations')) {
                        setInviteUserData(prev => ({ 
                          ...prev, 
                          locations: prev.locations.filter(l => l !== 'All Locations')
                        }));
                      } else {
                        setInviteUserData(prev => ({ ...prev, locations: ['All Locations'] }));
                      }
                    }}
                  >
                    <span className="location-option-text">All Locations</span>
                  </div>
                  
                  {locations.map((location) => (
                    <div
                      key={location}
                      className={`location-option ${inviteUserData.locations.includes(location) ? 'selected' : ''}`}
                      onClick={() => {
                        if (inviteUserData.locations.includes(location)) {
                          setInviteUserData(prev => ({ 
                            ...prev, 
                            locations: prev.locations.filter(l => l !== location)
                          }));
                        } else {
                          setInviteUserData(prev => ({ 
                            ...prev, 
                            locations: [...prev.locations.filter(l => l !== 'All Locations'), location]
                          }));
                        }
                      }}
                    >
                      <span className="location-option-text">{location}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="invite-button" onClick={handleInviteUser}>
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Permissions Modal */}
      {showRolePermissionsModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container full-screen">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Roles & Permissions</h2>
              <button className="sp-close-button" onClick={() => setShowRolePermissionsModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="permissions-content">
              {/* Role Selector */}
              <div className="role-selector">
                <label className="role-selector-label">Select Role to Edit:</label>
                <div className="role-scroll-view">
                  {roles.map((role) => (
                    <div
                      key={role}
                      className={`role-selector-option ${selectedRole === role ? 'selected' : ''}`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <span className="role-selector-text">{role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions Matrix */}
              {selectedRole && (
                <div className="permissions-matrix">
                  {Object.entries(permissions).map(([category, perms]) => (
                    <div key={category} className="permission-category">
                      <h3 className="permission-category-title">{category}</h3>
                      {perms.map((permission) => (
                        <div key={permission} className="permission-row">
                          <span className="permission-text">{permission}</span>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={rolePermissionStates[`${selectedRole}-${category}-${permission}`] || false}
                              onChange={() => togglePermission(selectedRole, category, permission)}
                            />
                            <span className="slider round"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wastage Reasons Modal */}
      {showWastageReasonsModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container full-screen">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Wastage Reasons</h2>
              <button className="sp-close-button" onClick={() => setShowWastageReasonsModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="permissions-content">
              <div className="form-section" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 240 }}>
                  <label className="form-label">Reason Label</label>
                  <input className="form-input" value={newReasonLabel} onChange={e => setNewReasonLabel(e.target.value)} placeholder="e.g., Spillage" />
                </div>
                <div style={{ minWidth: 200 }}>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={newReasonCategory} onChange={e => setNewReasonCategory(e.target.value)}>
                    <option value="Dish Waste">Dish Waste</option>
                    <option value="General Waste">General Waste</option>
                  </select>
                </div>
                <button
                  className="invite-button"
                  onClick={async () => {
                    if (!newReasonLabel.trim()) { alert('Please enter a reason label'); return; }
                    try {
                      const res = await WastageService.createWastageReason({ reason_label: newReasonLabel.trim(), reason_category: newReasonCategory, business_id: 1 });
                      setWastageReasons(prev => [...prev, res.data]);
                      setNewReasonLabel('');
                    } catch (e) {
                      alert(e.message || 'Failed to add reason');
                    }
                  }}
                >Add Reason</button>
              </div>

              <div className="users-list">
                {wastageReasons.map(r => (
                  <div key={r.reason_id} className="user-row">
                    <div className="user-info">
                      <div className="user-name">{r.reason_label}</div>
                      <div className="user-meta"><span className="user-role">{r.reason_category || 'General'}</span></div>
                    </div>
                    <div className="user-actions">
                      <button
                        className="action-button"
                        title="Delete"
                        onClick={async () => {
                          if (!window.confirm('Delete this reason?')) return;
                          try {
                            await WastageService.deleteWastageReason(r.reason_id);
                            setWastageReasons(prev => prev.filter(x => x.reason_id !== r.reason_id));
                          } catch (e) {
                            alert(e.message || 'Failed to delete reason');
                          }
                        }}
                      >
                        <FaTrash className="action-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 12, color: '#666' }}>
                Changes reflect immediately in Stock Out form reasons.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deviation Selector Modal */}
      {showDeviationModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Select Alert Deviation</h2>
              <button className="sp-close-button" onClick={() => setShowDeviationModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              <div className="role-grid deviation-options">
                {[5, 10, 15].map(p => (
                  <div
                    key={p}
                    className={`role-option ${deviation === p ? 'selected' : ''}`}
                    onClick={() => onSelectDeviation(p)}
                  >
                    <span className="role-option-text">{p}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Categories Modal (UI-only) */}
      {showInventoryCategoriesModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Inventory Categories</h2>
              <button className="sp-close-button" onClick={() => setShowInventoryCategoriesModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              <div className="form-section" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">New Category</label>
                  <input className="form-input" value={newCategoryLabel} onChange={e => setNewCategoryLabel(e.target.value)} placeholder="e.g., Spices" />
                </div>
                <button className="invite-button" style={{ maxWidth: 160 }} onClick={async () => {
                  const label = newCategoryLabel.trim();
                  if (!label) return;
                  if (inventoryCategories.some(c => c.toLowerCase() === label.toLowerCase())) { alert('Already exists'); return; }
                  await handleAddInventoryCategory(label);
                  setNewCategoryLabel('');
                }}>Add</button>
              </div>
              <div className="categories-list">
                {inventoryCategories.map(cat => (
                  <div key={cat} className="user-row">
                    <div className="user-info">
                      <div className="user-name">{cat}</div>
                    </div>
                    <div className="user-actions">
                      <button className="action-button" onClick={async () => { await handleDeleteInventoryCategory(cat); }}>
                        <FaTrash className="action-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 12, color: '#666' }}>Changes are saved for this business.</div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal (multi-step, UI-only) */}
      {showChangePasswordModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Change Password</h2>
              <button className="sp-close-button" onClick={() => setShowChangePasswordModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              {changePwdStep === 1 && (
                <>
                  <div className="form-section">
                    <label className="form-label">Current Password</label>
                    <input className="form-input" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Enter current password" />
                  </div>
                  <div className="modal-actions">
                    <button className="modal-action-button secondary" onClick={() => setShowChangePasswordModal(false)}>Cancel</button>
                    <button className="modal-action-button primary" onClick={async () => {
                      if (!oldPassword.trim()) { alert('Please enter current password'); return; }
                      try {
                        await authService.verifyPassword(oldPassword);
                        setChangePwdStep(2);
                      } catch (err) {
                        alert(err.message || 'Incorrect password');
                      }
                    }}>Continue</button>
                  </div>
                </>
              )}
              {changePwdStep === 2 && (
                <>
                  <div className="form-section">
                    <label className="form-label">New Password</label>
                    <input className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Re-enter New Password</label>
                    <input className="form-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
                  </div>
                  <div className="modal-actions">
                    <button className="modal-action-button secondary" onClick={() => setChangePwdStep(1)}>Back</button>
                    <button className="modal-action-button primary" onClick={handleChangePassword}>Save</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal (Promote/Demote) */}
      {showRoleChangeModal && targetUser && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">{roleChangeMode === 'promote' ? 'Promote User' : 'Demote User'}</h2>
              <button className="sp-close-button" onClick={() => setShowRoleChangeModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              <div className="form-section">
                <div className="role-grid">
                  {roleOptions.length === 0 && (
                    <div style={{ color: '#6b7280' }}>No available roles.</div>
                  )}
                  {roleOptions.map(r => (
                    <div
                      key={r}
                      className={`role-option ${r === targetUser.role ? 'selected' : ''}`}
                      onClick={async () => {
                        try {
                          const roleObj = allRoles.find(x => x.role_name === r);
                          if (!roleObj) throw new Error('Role not found');
                          await UserService.updateUserRole(targetUser.id, roleObj.role_id, businessId);
                        } catch (err) {
                          alert(err.message || 'Failed to update role');
                          return;
                        }
                        // Update UI and reload list
                        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: r } : u));
                        setShowRoleChangeModal(false);
                        loadUsers();
                      }}
                    >
                      <span className="role-option-text">{r}</span>
                    </div>
                  ))}
                </div>
                {rolesError && <div style={{ color: '#dc2626', marginTop: 8 }}>{rolesError}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Default Payment Terms Modal */}
      {showPaymentTermsModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Default Payment Terms</h2>
              <button className="sp-close-button" onClick={() => setShowPaymentTermsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              <div className="role-grid default-payments-options">
                {[7, 14, 21, 30].map(d => (
                  <div
                    key={d}
                    className={`role-option ${paymentTermDays === d ? 'selected' : ''}`}
                    onClick={() => onSelectPaymentTerm(d)}
                  >
                    <span className="role-option-text">{d} Days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operating Hours Modal */}
      {showOperatingHoursModal && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-container full-screen">
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Hours</h2>
              <button 
                className="sp-close-button" 
                onClick={() => setShowOperatingHoursModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="sp-modal-content">
              <div className="operating-hours-content">
                {Object.entries(operatingHours).map(([day, dayData]) => (
                  <div key={day} className="operating-day-section">
                    <div className="day-header">
                      <span className="day-name">{day}</span>
                      <div className="day-toggle">
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={dayData.isOpen}
                            onChange={() => toggleDayStatus(day)}
                          />
                          <span className="slider round"></span>
                        </label>
                        <span className="day-status">{dayData.isOpen ? 'Open' : 'Closed'}</span>
                      </div>
                    </div>
                    
                    {dayData.isOpen && (
                      <div className="shifts-container">
                        {Object.entries(dayData.shifts).map(([shiftName, shiftData]) => (
                          <div key={shiftName} className="shift-row">
                            <div className="shift-header">
                              <span className="shift-name">
                                {shiftName.charAt(0).toUpperCase() + shiftName.slice(1)}
                              </span>
                              {shiftData.enabled && (
                                <button 
                                  className="remove-shift-button"
                                  onClick={() => disableShift(day, shiftName)}
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>
                            
                            {shiftData.enabled ? (
                              <div className="time-inputs">
                                <div className="time-input-group">
                                  <label>Opens at</label>
                                  <input
                                    type="text"
                                    className="time-input"
                                    value={shiftData.start}
                                    onChange={(e) => updateShiftTime(day, shiftName, 'start', e.target.value)}
                                    placeholder="9:00 AM"
                                  />
                                </div>
                                <span className="time-separator">—</span>
                                <div className="time-input-group">
                                  <label>Closes at</label>
                                  <input
                                    type="text"
                                    className="time-input"
                                    value={shiftData.end}
                                    onChange={(e) => updateShiftTime(day, shiftName, 'end', e.target.value)}
                                    placeholder="5:00 PM"
                                  />
                                </div>
                              </div>
                            ) : (
                              <button 
                                className="add-hours-button"
                                onClick={() => enableShift(day, shiftName)}
                              >
                                Add hours
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-action-button secondary"
                  onClick={() => setShowOperatingHoursModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-action-button primary"
                  onClick={() => {
                    // Save operating hours logic here
                    console.log('Saving operating hours:', operatingHours);
                    setShowOperatingHoursModal(false);
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;