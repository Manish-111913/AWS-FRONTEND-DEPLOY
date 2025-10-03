import React, { useState, useEffect } from 'react';
import './ComplementaryItems.css';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { http } from '../services/apiClient';
import ImageWithFallback from './ImageWithFallback';

// --- Icon Components (to avoid external dependencies) ---
// Currently unused but kept for potential future UI enhancements:
// const UnitMappingIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
// const RecipeItemsIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 15l-4-4h8l-4 4z"></path><path d="M12 8v3"></path></svg>;
// const AnalyticsIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
// const SettingsIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const BackArrowIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const LinkIcon = () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;

// --- Helpers ---
const api = {
    async getComplimentaryRecipes() {
        // Uses centralized client: injects X-Tenant-Id header automatically
        const data = await http.get('recipes?category=Complimentary');
        if (!data?.success) throw new Error(data?.error || 'Failed to load recipes');
        return data.data || [];
    },
    async getRecipeIngredients(id) {
        const data = await http.get(`recipes/${id}/ingredients`);
        if (!data?.success) throw new Error(data?.error || 'Failed to load ingredients');
        return data.data || [];
    },
    async saveRecipeIngredients(id, ingredients) {
        const data = await http.put(`recipes/${id}/ingredients`, { ingredients });
        if (!data?.success) throw new Error(data?.error || 'Failed to save');
        return data.data;
    }
};

// --- Main Component ---
function ComplementaryItems({ goTo }) {
    // Start at enhancements to immediately trigger data load for complimentary items
    const [screen, setScreen] = useState('enhancements');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [recipes, setRecipes] = useState([]); // complimentary menu items
    const [selectedItems, setSelectedItems] = useState([]); // selected recipes

    // Map: recipeId -> [{ name, quantity, unit }]
    const [ingredientsMap, setIngredientsMap] = useState({});
    // Map: recipeId -> { ingredientName: quantity }
    const [quantities, setQuantities] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Load complimentary recipes on first meaningful screen
    useEffect(() => {
        if (screen === 'enhancements') {
            setLoading(true);
            setError(null);
            api.getComplimentaryRecipes()
                .then(list => setRecipes(list))
                .catch(e => setError(e.message || 'Failed to load'))
                .finally(() => setLoading(false));
        }
    }, [screen]);

    // When entering configure, fetch ingredients for each selected recipe
    useEffect(() => {
        async function loadIngredients() {
            if (screen !== 'configure' || selectedItems.length === 0) return;
            setLoading(true);
            setError(null);
            try {
                const entries = await Promise.all(
                    selectedItems.map(async (item) => {
                        const ing = await api.getRecipeIngredients(item.id);
                        return [item.id, ing];
                    })
                );
                const ingMap = Object.fromEntries(entries);
                setIngredientsMap(ingMap);
                // initialize quantities from backend values
                const initial = {};
                selectedItems.forEach(item => {
                    initial[item.id] = {};
                    (ingMap[item.id] || []).forEach(ri => {
                        initial[item.id][ri.name] = Number(ri.quantity) || 0;
                    });
                });
                setQuantities(initial);
            } catch (e) {
                setError(e.message || 'Failed to load ingredients');
            } finally {
                setLoading(false);
            }
        }
        loadIngredients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen, selectedItems]);

    const handleSelectItem = (item) => {
        setSelectedItems(prev => {
            const isSelected = prev.find(i => i.id === item.id);
            if (isSelected) return prev.filter(i => i.id !== item.id);
            return [...prev, item];
        });
    };

    const stepForUnit = (unit) => {
        const u = (unit || '').toLowerCase();
        return ['g', 'ml'].includes(u) ? 10 : 1;
    };

    const handleQuantityChange = (itemId, ingredientName, unit, direction) => {
        setQuantities(prev => {
            const current = prev[itemId]?.[ingredientName] || 0;
            const delta = stepForUnit(unit) * (direction === 'inc' ? 1 : -1);
            return {
                ...prev,
                [itemId]: {
                    ...(prev[itemId] || {}),
                    [ingredientName]: Math.max(0, Number((current + delta).toFixed(4)))
                }
            };
        });
    };

    const handleQuantityInputChange = (itemId, ingredientName, value) => {
        const v = parseFloat(value);
        setQuantities(prev => ({
            ...prev,
            [itemId]: { ...(prev[itemId] || {}), [ingredientName]: isNaN(v) ? 0 : v }
        }));
    };

    const handleUnitChange = (itemId, ingredientName, newUnit) => {
        setIngredientsMap(prev => {
            const updated = { ...prev };
            updated[itemId] = (updated[itemId] || []).map(ri =>
                ri.name === ingredientName ? { ...ri, unit: newUnit } : ri
            );
            return updated;
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);
            // Save each selected recipe
            for (const item of selectedItems) {
                const ingArr = (ingredientsMap[item.id] || []).map(ri => ({
                    name: ri.name,
                    unit: ri.unit,
                    quantity: Number(quantities[item.id]?.[ri.name] ?? 0)
                }));
                await api.saveRecipeIngredients(item.id, ingArr);
            }
            setShowSuccessModal(true);
        } catch (e) {
            setError(e.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        if (goTo) {
            goTo('dashboard');
        } else {
            window.location.href = '/dashboard';
        }
    };

    const goBack = () => {
        if (screen === 'configure') setScreen('enhancements');
        else if (screen === 'enhancements') setScreen('associatedItems');
    };

    const renderScreen = () => {
        switch (screen) {
            case 'enhancements':
                return (
                    <EnhancementsScreen
                        loading={loading}
                        error={error}
                        items={recipes}
                        selectedItems={selectedItems}
                        onSelectItem={handleSelectItem}
                        onNext={() => setScreen('configure')}
                        onBack={goBack}
                    />
                );
            case 'configure':
                return (
                    <ConfigureScreen
                        loading={loading}
                        error={error}
                        selectedItems={selectedItems}
                        ingredientsMap={ingredientsMap}
                        quantities={quantities}
                        onQuantityChange={handleQuantityChange}
                        onQuantityInputChange={handleQuantityInputChange}
                        onUnitChange={handleUnitChange}   // ✅ pass unit change handler
                        onSave={handleSave}
                        onBack={goBack}
                    />
                );
            case 'associatedItems':
            default:
                return <AssociatedItemsScreen onNext={() => setScreen('enhancements')} />;
        }
    };

    return (
        <div className="mobile-view">
            {renderScreen()}
            {showSuccessModal && <SuccessModal onClose={closeSuccessModal} />}
        </div>
    );
}

// --- Screen Components ---

const AssociatedItemsScreen = ({ onNext }) => (
    <div className="screen associated-items-screen">
        <header className="screen-header">
            <h2>Associated Items</h2>
            
        </header>
        <main className="associated-items-content">
            <div className="info-card">
                <LinkIcon />
                <h3 style={{textAlign:'center', color: '#000'}}>Link Your Main Dishes to Complimentary Items</h3>
                <p style={{padding:'0 1.4rem'}}>
                    Link your main dishes to all the freebies you serve with them. 
                    This ensures accurate cost tracking for every complimentary item you give away, 
                    from sambar with dosa to ketchup with fries.
                </p>
            </div>
        </main>
        <footer className="screen-footer">
            <button className="action-button orange" onClick={onNext}>
                Let's Get Started
            </button>
        </footer>
    </div>
);

const EnhancementsScreen = ({ loading, error, items, selectedItems, onSelectItem, onNext, onBack }) => (
    <div className="screen">
        <header className="screen-header">
            <button onClick={onBack} className="back-button"><BackArrowIcon /></button>
            <h2 color='#000 !important'>Enhancements</h2>
            <p>Select the complimentary items you serve with your dishes</p>
        </header>
        <main className="enhancements-grid">
            {loading && <p>Loading…</p>}
            {error && !loading && (
                <p className="error-text">
                    {String(error).includes('tenant_context_missing')
                      ? 'Tenant context missing. Please select a business or sign in again.'
                      : error}
                </p>
            )}
            {!loading && !error && items && items.length === 0 && (
                <p>No complimentary items found. Seed or create recipes in the "Complimentary" category.</p>
            )}
            {!loading && !error && items && items.map(item => {
                const selectedIndex = selectedItems.findIndex(i => i.id === item.id);
                const isSelected = selectedIndex !== -1;
                const image = item.image || undefined;
                const fallback = item.fallback_img || undefined;
                const fallbacks = item.fallbacks || [];
                const placeholder = item.placeholder_img || undefined;
                return (
                    <div key={item.id} className={`item-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelectItem(item)}>
                        {isSelected && <div className="selection-badge">{selectedIndex + 1}</div>}
                                                <div className="item-image">
                                                    <ImageWithFallback src={image} fallback={fallback} fallbacks={fallbacks} placeholder={placeholder} alt={item.name} />
                        </div>
                        <p style={{color:'#000'}}>{item.name}</p>
                    </div>
                );
            })}
        </main>
        <footer className="screen-footer">
            <button 
                className="action-button" 
                disabled={selectedItems.length === 0}
                onClick={onNext}
            >
                {selectedItems.length > 0 ? `Next (${selectedItems.length} selected)` : 'Select Items to Continue'}
            </button>
        </footer>
    </div>
);

const ConfigureScreen = ({ loading, error, selectedItems, ingredientsMap, quantities, onQuantityChange, onQuantityInputChange, onUnitChange, onSave, onBack }) => (
    <div className="screen">
         <header className="screen-header">
            <button onClick={onBack} className="back-button"><BackArrowIcon /></button>
            <h2>Configure the quantity for each selected item</h2>
        </header>
        <main className="configure-list">
            {loading && <p>Loading…</p>}
            {error && !loading && <p className="error-text">{error}</p>}
            {!loading && !error && selectedItems.map((item, index) => (
                <div key={item.id} className="recipe-section">
                    <div className="recipe-header">
                        <div className="selection-badge">{index + 1}</div>
                        <h3>{item.name}</h3>
                    </div>

                    {(ingredientsMap[item.id] || []).map(ing => (
                        <div key={ing.name} className="ingredient-row">
                            <span className="ingredient-name">{ing.name}</span>
                            <div className="controls-inline">
                                <button
                                    className="square-btn"
                                    onClick={() => onQuantityChange(item.id, ing.name, ing.unit, 'dec')}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    className="number-input"
                                    value={quantities[item.id]?.[ing.name] ?? 0}
                                    onChange={(e) => onQuantityInputChange(item.id, ing.name, e.target.value)}
                                />
                                <button
                                    className="square-btn"
                                    onClick={() => onQuantityChange(item.id, ing.name, ing.unit, 'inc')}
                                >
                                    +
                                </button>
                                <select
                                    className="select-input"
                                    value={ing.unit}
                                    onChange={(e) => onUnitChange(item.id, ing.name, e.target.value)}
                                >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="l">l</option>
                                    <option value="pcs">pcs</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </main>
         <footer className="screen-footer">
            <button className="action-button" onClick={onSave}>Save & Finish</button>
        </footer>
    </div>
);

const SuccessModal = ({ onClose }) => (
    <div className="modal-overlay">
        <div className="modal-content">
            <h3>Success!</h3>
            <p style={{textAlign:'center'}}><FontAwesomeIcon icon={faCheck} style={{ fontSize: '1.6rem', color: '#28a745'}} /></p>
            <p>Recipe enhancements have been saved successfully.</p>
            <button onClick={onClose}>OK</button>
        </div>
    </div>
);


export default ComplementaryItems;
