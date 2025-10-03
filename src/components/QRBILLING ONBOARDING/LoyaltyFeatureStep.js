import React, { useState } from 'react';
import { Star, Plus, X } from 'lucide-react';

export default function LoyaltyFeatureStep({ formData, updateFormData }) {
  const [enabled, setEnabled] = useState(!!formData.loyaltyEnabled);
  const [points, setPoints] = useState(String(formData.pointsPerDollar || 1));
  const [rewards, setRewards] = useState(formData.rewards || []);
  const [showAdd, setShowAdd] = useState(false);
  const [newReward, setNewReward] = useState({ name: '', pointsCost: '', description: '' });

  const toggle = () => {
    const v = !enabled;
    setEnabled(v);
    updateFormData({ loyaltyEnabled: v, pointsPerDollar: v ? parseFloat(points) || 1 : 0, rewards: v ? rewards : [] });
  };

  const onPoints = (val) => {
    setPoints(val);
    if (enabled) updateFormData({ loyaltyEnabled: true, pointsPerDollar: parseFloat(val) || 1, rewards });
  };

  const add = () => {
    if (!newReward.name || !newReward.pointsCost || !newReward.description) {
      alert('Please fill in all reward fields');
      return;
    }
    const r = {
      id: 'reward-' + Date.now(),
      name: newReward.name,
      pointsCost: parseInt(newReward.pointsCost, 10) || 0,
      description: newReward.description,
    };
    const updated = rewards.concat(r);
    setRewards(updated);
    setShowAdd(false);
    setNewReward({ name: '', pointsCost: '', description: '' });
    updateFormData({ loyaltyEnabled: enabled, pointsPerDollar: parseFloat(points) || 1, rewards: updated });
  };

  const remove = (id) => {
    const updated = rewards.filter((r) => r.id !== id);
    setRewards(updated);
    updateFormData({ loyaltyEnabled: enabled, pointsPerDollar: parseFloat(points) || 1, rewards: updated });
  };
  return (
    <div>
      <p className="qro-center" style={{ color: '#9CA3AF', lineHeight: '24px', marginBottom: '24px' }}>
        Set up a loyalty program to encourage repeat customers and increase customer engagement with your restaurant.
      </p>

      <div className="qro-row qro-card" style={{ justifyContent: 'space-between', marginBottom: 32 }}>
        <div className="qro-row" style={{ gap: 12 }}>
          <div style={{ width: 48, height: 48, background: '#374151', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Enable Loyalty Program</div>
            <div style={{ color: '#9CA3AF', fontSize: 14 }}>Reward customers with points for every purchase</div>
          </div>
        </div>
        <div className={`qro-toggle${enabled ? ' qro-active' : ''}`} onClick={toggle}>
          <div className="qro-knob" />
        </div>
      </div>

      {enabled ? (
        <>
          <div className="qro-section">
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8 }}>Points Configuration</div>
            <div style={{ color: '#9CA3AF', marginBottom: 16, fontSize: 14 }}>Set how many points customers earn per dollar spent</div>
            <div className="qro-row" style={{ alignItems: 'center', background: '#2a2a2a', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <input
                className="qro-input"
                style={{ maxWidth: 120, fontWeight: 700, fontSize: 24, color: 'var(--accent)' }}
                value={points}
                onChange={(e) => onPoints(e.target.value)}
                placeholder="1"
              />
              <div style={{ marginLeft: 12 }}>points per $1</div>
            </div>
            <div className="qro-card">
              <div className="center" style={{ color: '#D1D5DB', fontStyle: 'italic' }}>
                {`Example: $20 order = ${Math.round(20 * (parseFloat(points) || 1))} points`}
              </div>
            </div>
          </div>

          <div className="qro-section">
            <div className="qro-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Rewards</div>
              <button className="qro-btn qro-btn--primary" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Add Reward
              </button>
            </div>
            <div style={{ color: '#9CA3AF', marginBottom: 16 }}>Define what customers can redeem with their points</div>

            {rewards.length === 0 && !showAdd && (
              <div className="qro-empty">
                <div>No rewards yet</div>
                <div>Add rewards to give customers something to work towards</div>
              </div>
            )}

            {showAdd && (
              <div className="qro-card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Add New Reward</div>
                <input
                  className="qro-input"
                  placeholder="Reward name (e.g., Free Coffee)"
                  value={newReward.name}
                  onChange={(e) => setNewReward((o) => ({ ...o, name: e.target.value }))}
                />
                <input
                  className="qro-input"
                  placeholder="Points required"
                  value={newReward.pointsCost}
                  onChange={(e) => setNewReward((o) => ({ ...o, pointsCost: e.target.value }))}
                />
                <textarea
                  className="qro-input"
                  placeholder="Description"
                  rows={3}
                  value={newReward.description}
                  onChange={(e) => setNewReward((o) => ({ ...o, description: e.target.value }))}
                />
                <div className="qro-row" style={{ gap: 12, marginTop: 12 }}>
                  <button className="qro-btn" onClick={() => setShowAdd(false)}>
                    Cancel
                  </button>
                  <button className="qro-btn qro-btn--success" onClick={add}>
                    Add Reward
                  </button>
                </div>
              </div>
            )}

            {rewards.map((r) => (
              <div key={r.id} className="qro-row qro-card" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
                  <div style={{ color: 'var(--accent)', marginBottom: 6 }}>{r.pointsCost + ' points'}</div>
                  <div style={{ color: '#9CA3AF' }}>{r.description}</div>
                </div>
                <button className="qro-btn qro-btn--danger" onClick={() => remove(r.id)}>
                  <X size={16} /> Remove
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="qro-empty">
          <div style={{ fontSize: 20, color: '#6B7280' }}>Loyalty Program Disabled</div>
          <div style={{ color: '#9CA3AF' }}>
            You can enable and configure the loyalty program later from the admin dashboard
          </div>
        </div>
      )}
    </div>
  );
}

