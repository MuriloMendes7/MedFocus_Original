import { useEffect } from 'react';

/**
 * Hook para ativar animações de scroll sutis e escalonadas (.reveal -> .is-revealed)
 */
export const useScrollReveal = (deps = []) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            // Uma vez revelado, não precisa reanimar ao subir
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      },
    );

    const elements = document.querySelectorAll('.reveal:not(.is-revealed)');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, deps);
};

export default useScrollReveal;
