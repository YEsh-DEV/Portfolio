import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RotatingText.css';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * RotatingText — animated text rotator with character/word/line stagger.
 *
 * Used in the Projects section heading to cycle through category labels
 * (e.g. "AI", "Full-Stack", "Creative") with a smooth slide-up animation
 * that matches the warm palette (#282624 ink, spring physics).
 */
const RotatingText = forwardRef((props, ref) => {
  const {
    texts,
    transition       = { type: 'spring', damping: 25, stiffness: 300 },
    initial          = { y: '110%', opacity: 0 },
    animate          = { y: 0, opacity: 1 },
    exit             = { y: '-110%', opacity: 0 },
    animatePresenceMode    = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2200,
    staggerDuration  = 0,
    staggerFrom      = 'first',
    loop             = true,
    auto             = true,
    splitBy          = 'characters',
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Split text into grapheme clusters (handles emoji / multi-code-point chars)
  const splitIntoCharacters = (text) => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];

    if (splitBy === 'characters') {
      return currentText.split(' ').map((word, i, arr) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === 'words') {
      return currentText.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === 'lines') {
      return currentText.split('\n').map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1,
      }));
    }
    return currentText.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback(
    (index, totalChars) => {
      if (staggerFrom === 'first')  return index * staggerDuration;
      if (staggerFrom === 'last')   return (totalChars - 1 - index) * staggerDuration;
      if (staggerFrom === 'center') {
        const center = Math.floor(totalChars / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === 'random') {
        const rand = Math.floor(Math.random() * totalChars);
        return Math.abs(rand - index) * staggerDuration;
      }
      return Math.abs(staggerFrom - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration],
  );

  const handleIndexChange = useCallback(
    (newIndex) => {
      setCurrentTextIndex(newIndex);
      if (onNext) onNext(newIndex);
    },
    [onNext],
  );

  const next = useCallback(() => {
    const nextIndex =
      currentTextIndex === texts.length - 1
        ? loop ? 0 : currentTextIndex
        : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex);
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex =
      currentTextIndex === 0
        ? loop ? texts.length - 1 : currentTextIndex
        : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex);
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback(
    (index) => {
      const valid = Math.max(0, Math.min(index, texts.length - 1));
      if (valid !== currentTextIndex) handleIndexChange(valid);
    },
    [texts.length, currentTextIndex, handleIndexChange],
  );

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) handleIndexChange(0);
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [
    next, previous, jumpTo, reset,
  ]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, auto]);

  return (
    <motion.span
      className={cn('text-rotate', mainClassName)}
      layout
      transition={transition}
      {...rest}
    >
      {/* Accessible text for screen readers */}
      <span className="text-rotate-sr-only">{texts[currentTextIndex]}</span>

      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span
          key={currentTextIndex}
          className={cn(
            splitBy === 'lines' ? 'text-rotate-lines' : 'text-rotate',
          )}
          layout
          aria-hidden="true"
        >
          {elements.map((wordObj, wordIndex, array) => {
            const prevChars = array
              .slice(0, wordIndex)
              .reduce((sum, w) => sum + w.characters.length, 0);
            const totalChars = array.reduce(
              (sum, w) => sum + w.characters.length, 0,
            );

            return (
              <span
                key={wordIndex}
                className={cn('text-rotate-word', splitLevelClassName)}
              >
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(prevChars + charIndex, totalChars),
                    }}
                    className={cn('text-rotate-element', elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && (
                  <span className="text-rotate-space"> </span>
                )}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = 'RotatingText';
export default RotatingText;
