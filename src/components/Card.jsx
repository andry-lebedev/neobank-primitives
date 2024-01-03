export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-[#1F2937] border border-[#374151] shadow-sm ${onClick ? 'cursor-pointer hover:bg-[#374151] transition-colors duration-150' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
