import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import './AnimatedList.css';

const AnimatedItem = ({ children, delay = 0, index, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.3, triggerOnce: true }); // Only animate once when coming into view
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.2, delay: Math.min(delay, 0.1), ease: "easeOut" }} // Cap delay to prevent long waits
      style={{ marginBottom: '1rem' }}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedList
 *
 * Props:
 * - items: any[]
 * - onItemSelect?: (item, index) => void
 * - showGradients?: boolean
 * - enableArrowNavigation?: boolean
 * - className?: string
 * - itemClassName?: string
 * - displayScrollbar?: boolean
 * - initialSelectedIndex?: number
 * - renderItem?: (item, index, selected) => ReactNode  // custom renderer
 * - getItemKey?: (item, index) => string | number      // key extractor
 */
const AnimatedList = ({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  renderItem,
  getItemKey
}) => {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const handleScroll = e => {
    // Throttle scroll updates to reduce re-renders
    if (scrollTimeoutRef.current) return;
    scrollTimeoutRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      // Use direct DOM manipulation to avoid React re-renders during scroll
      const container = e.target.parentElement;
      const topGradient = container.querySelector('.top-gradient');
      const bottomGradient = container.querySelector('.bottom-gradient');

      if (topGradient) {
        const opacity = Math.min(scrollTop / 50, 1);
        topGradient.style.opacity = opacity;
      }

      if (bottomGradient) {
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        const opacity = scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1);
        bottomGradient.style.opacity = opacity;
      }

      scrollTimeoutRef.current = null;
    }, 16); // ~60fps
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = e => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.min((prev ?? -1) + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.max((prev ?? 0) - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onItemSelect?.(items[selectedIndex], selectedIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`scroll-list-container ${className}`}>
      <div ref={listRef} className={`scroll-list ${!displayScrollbar ? 'no-scrollbar' : ''}`} onScroll={handleScroll}>
        {items.map((item, index) => (
          <AnimatedItem
            key={getItemKey ? getItemKey(item, index) : index}
            delay={0.02 + index * 0.005} // Much shorter delays
            index={index}
            onClick={() => {
              setSelectedIndex(index);
              onItemSelect?.(item, index);
            }}
          >
            {renderItem ? (
              renderItem(item, index, selectedIndex === index)
            ) : (
              <div className={`item ${selectedIndex === index ? 'selected' : ''} ${itemClassName}`}>
                <p className="item-text">{String(item)}</p>
              </div>
            )}
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div className="top-gradient"></div>
          <div className="bottom-gradient"></div>
        </>
      )}
    </div>
  );
};

export default AnimatedList;
