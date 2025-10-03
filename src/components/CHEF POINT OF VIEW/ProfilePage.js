import React, { useState } from 'react';
import './ProfilePage.css';
import './shared.css';
import { User, MapPin, CreditCard, Bell, Settings, HelpCircle, LogOut, Phone, Mail, Edit } from 'lucide-react';

export default function ProfilePage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const profile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    address: '123 Main Street, Apt 4B, New York, NY 10001',
    memberSince: 'January 2023',
    totalOrders: 47,
    favoriteItems: 8,
  };

  const menuItems = [
    { id:'orders', title: 'My Orders', subtitle: `${profile.totalOrders} orders placed`, icon: User },
    { id:'addresses', title: 'Delivery Addresses', subtitle: 'Manage your addresses', icon: MapPin },
    { id:'payments', title: 'Payment Methods', subtitle: 'Cards and payment options', icon: CreditCard },
    { id:'settings', title: 'App Settings', subtitle: 'Preferences and configuration', icon: Settings },
    { id:'help', title: 'Help & Support', subtitle: 'FAQs and customer support', icon: HelpCircle },
  ];

  return (
    <div className="qr-profile">
      <div className="profile-head">
        <h2>Profile</h2>
        <button className="icon-btn"><Edit size={18} /></button>
      </div>
      <div className="profile-card">
        <div className="profile-top">
          <img src={profile.avatar} alt="avatar" className="avatar" />
          <div className="info">
            <h3>{profile.name}</h3>
            <p className="since">Member since {profile.memberSince}</p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail"><Mail size={14}/> {profile.email}</div>
            <div className="detail"><Phone size={14}/> {profile.phone}</div>
            <div className="detail"><MapPin size={14}/> {profile.address}</div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat"><div className="num">{profile.totalOrders}</div><div className="lbl">Total Orders</div></div>
        <div className="stat"><div className="num">{profile.favoriteItems}</div><div className="lbl">Favorite Items</div></div>
        <div className="stat"><div className="num">4.9</div><div className="lbl">Avg Rating</div></div>
      </div>

      <div className="quick-settings">
        <h3>Quick Settings</h3>
        <div className="setting-row">
          <div className="left"><Bell size={18}/> <span>Push Notifications</span></div>
          <input type="checkbox" checked={notificationsEnabled} onChange={e=>setNotificationsEnabled(e.target.checked)} />
        </div>
        <div className="setting-row">
          <div className="left"><MapPin size={18}/> <span>Location Services</span></div>
          <input type="checkbox" checked={locationEnabled} onChange={e=>setLocationEnabled(e.target.checked)} />
        </div>
      </div>

      <div className="menu-section">
        <h3>Account</h3>
        {menuItems.map(mi => {
          const Icon = mi.icon;
          return (
            <button key={mi.id} className="menu-item" onClick={()=>console.log(mi.id)}>
              <div className="left"><Icon size={18}/> <div className="txt"><div className="t">{mi.title}</div><div className="s">{mi.subtitle}</div></div></div>
              <span className="chevron">›</span>
            </button>
          );
        })}
      </div>

      <button className="logout-btn"><LogOut size={18} color="#ff4444"/> Sign Out</button>
      <div className="app-version">Version 1.0.0</div>
    </div>
  );
}
