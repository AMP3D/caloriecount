import './ConfirmDialog.scss';

interface ConfirmDialogProps {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog = ({ message, onCancel, onConfirm }: ConfirmDialogProps) => (
  <div className="confirm-overlay" onClick={onCancel}>
    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
      <p className="confirm-message">{message}</p>

      <div className="confirm-actions">
        <button className="confirm-btn cancel" onClick={onCancel}>
          Cancel
        </button>

        <button className="confirm-btn confirm" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </div>
  </div>
);
