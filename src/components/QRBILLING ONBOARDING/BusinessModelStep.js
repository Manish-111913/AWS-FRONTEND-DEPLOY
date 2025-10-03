import React, { useState } from 'react';
import { CreditCard, ShoppingBag } from 'lucide-react';

export default function BusinessModelStep({ formData, updateFormData }) {
  const [selected, setSelected] = useState(formData.businessModel || '');
    const models=[
      {id:'pay-first', title:'Pay First, Eat Later', desc:'Customers pay for their order upfront before receiving their food. Great for fast-casual dining and reducing payment friction.'},
      {id:'eat-first', title:'Eat First, Pay Later', desc:'Traditional dining experience where customers order, eat, and then pay at the end. Ideal for full-service restaurants.'}
    ];

  const select = (id) => {
    setSelected(id);
    updateFormData({ businessModel: id });
  };

  return (
    <div>
      <p className="qro-center" style={{ color: '#9CA3AF', lineHeight: '24px', marginBottom: '24px' }}>
        {"Choose the payment flow that best fits your restaurant's operation style. This will determine how customers interact with your QR billing system."}
      </p>
      <div className="qro-list">
        {models.map((m) => (
          <div key={m.id} className={`qro-model-card${selected === m.id ? ' qro-active' : ''}`} onClick={() => select(m.id)}>
            <div className="qro-row" style={{ gap: 10, alignItems: 'center', marginBottom: 8 }}>
              {m.id === 'pay-first' ? <CreditCard size={18} /> : <ShoppingBag size={18} />}
              <div className="qro-model-title" style={{ margin: 0 }}>{m.title}</div>
            </div>
            <p className="qro-model-desc">{m.desc}</p>
            <div>
              <div>Key Benefits:</div>
              <ul>
                {(m.id === 'pay-first'
                  ? ['Guaranteed payment', 'Faster table turnover', 'Reduced payment disputes', 'Better cash flow']
                  : ['Traditional dining experience', 'Opportunity for upselling', 'Customer can modify orders', 'Better for groups and special occasions']
                ).map((b, i) => (
                  <li key={i} style={{ color: selected === m.id ? '#1a1a1a' : '#D1D5DB' }}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="qro-card" style={{ marginTop: 24 }}>
          <div className="qro-center" style={{ color: '#D1D5DB', marginBottom: 8 }}>
            {"You've selected: "}
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{models.find((x) => x.id === selected)?.title}</span>
          </div>
          <div className="qro-center" style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
            You can change this setting later in the admin dashboard.
          </div>
        </div>
      )}
    </div>
  );
}

