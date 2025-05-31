import { useState } from 'react';

export const useConfirmModal = () => {
  const [visible, setVisible] = useState(false);
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {});

  const show = (action: () => void) => {
    /**
     * Show Modal -> Execute an action (function) -> Hide Modal
     */
    setOnConfirm(() => () => {
      action();
      hide();
    });
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
    setOnConfirm(() => () => {});
  };

  return {
    visible,
    onConfirm,
    show,
    hide,
  };
};
