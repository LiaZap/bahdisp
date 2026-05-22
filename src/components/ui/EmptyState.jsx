import { FiInbox } from 'react-icons/fi'

export default function EmptyState({ icon: Icon = FiInbox, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Icon className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 text-center max-w-sm">{description}</p>
      {action && (
        <button onClick={onAction} className="btn-primary">
          {action}
        </button>
      )}
    </div>
  )
}
