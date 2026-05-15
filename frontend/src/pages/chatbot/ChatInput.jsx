/**
 * ChatInput.jsx
 * Re-themed from Awaaz UnifiedInput.jsx to PV design system.
 * Full Tailwind — zero inline styles.
 *
 * Props:
 *   value, onChange, onSubmit, onMic, onMicStart, onMicEnd, onFileSelect
 *   micActive, loading, disabled, filePreview, onClearFile
 */

import { useRef } from 'react'
import { Mic, MicOff, Paperclip, Send, X } from 'lucide-react'

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onMic,
  onMicStart,
  onMicEnd,
  micActive = false,
  loading = false,
  disabled = false,
  filePreview = null,
  onClearFile,
  onFileSelect,
  placeholder = 'Ask anything…',
}) {
  const fileRef = useRef(null)
  const hasHoldMic = Boolean(onMicStart && onMicEnd)

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {/* File preview chip */}
      {filePreview && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-xl w-fit max-w-xs">
          <Paperclip className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <span className="text-xs text-primary-500 truncate font-medium">{filePreview.name}</span>
          {onClearFile && (
            <button
              type="button"
              onClick={onClearFile}
              className="text-primary-500 hover:text-primary-600 ml-1 flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Input row */}
      <div className={`
        flex items-end gap-2 p-2 rounded-2xl border transition-all duration-200
        bg-surface-card border-surface-border
        focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/30
        ${disabled ? 'opacity-60' : ''}
      `}>
        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          id="chat-file-input"
          className="hidden"
          accept="image/*,.pdf,.xlsx,.xls,.csv"
          onChange={onFileSelect}
        />

        {/* Attach button */}
        {onFileSelect && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || loading}
            title="Attach file or image"
            className={`
              p-2 rounded-xl transition-colors flex-shrink-0
              text-surface-muted hover:text-primary-500 hover:bg-primary-500/10
              disabled:opacity-40
            `}
          >
            <Paperclip className="w-4 h-4" />
          </button>
        )}

        {/* Textarea */}
        <textarea
          id="chat-message-input"
          rows={1}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled || loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit(e)
            }
          }}
          className="
            flex-1 bg-transparent resize-none text-sm text-surface-text
            placeholder:text-surface-muted/60 focus:outline-none
            min-h-[36px] max-h-[120px] py-2 leading-relaxed
          "
          style={{ fieldSizing: 'content' }}
        />

        {/* Mic button */}
        {onMic && (
          <button
            type="button"
            onClick={hasHoldMic ? undefined : onMic}
            onPointerDown={hasHoldMic ? (e) => {
              e.preventDefault()
              onMicStart()
            } : undefined}
            onPointerUp={hasHoldMic ? (e) => {
              e.preventDefault()
              onMicEnd()
            } : undefined}
            onPointerCancel={hasHoldMic ? onMicEnd : undefined}
            onPointerLeave={hasHoldMic && micActive ? onMicEnd : undefined}
            disabled={disabled || loading}
            title={micActive ? 'Release to send voice' : 'Hold for voice input'}
            className={`
              p-2 rounded-xl transition-all flex-shrink-0 disabled:opacity-40
              ${micActive
                ? 'bg-accent-rose/10 text-accent-rose animate-pulse-slow'
                : 'text-surface-muted hover:text-primary-500 hover:bg-primary-500/10'
              }
            `}
          >
            {micActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || loading || (!value.trim() && !filePreview)}
          id="chat-send-btn"
          className="
            p-2 rounded-xl bg-primary-500 text-white
            hover:bg-primary-600 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 flex-shrink-0
          "
          aria-label="Send message"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Voice indicator */}
      {micActive && (
        <p className="text-xs text-accent-rose text-center animate-pulse-slow flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse-slow inline-block" />
          Listening… speak now
        </p>
      )}
    </form>
  )
}
