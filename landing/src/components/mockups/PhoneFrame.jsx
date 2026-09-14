/* A phone-shaped frame to host faithful, hand-built recreations of real
   in-app screens (not photos, not generic dashboard art) using the app's
   own color tokens and type scale. */
export default function PhoneFrame({ children, className = '' }) {
  return (
    <div className={`relative w-[290px] shrink-0 select-none ${className}`}>
      <div className="rounded-[42px] border-[6px] border-[#221743] bg-black p-2 shadow-card">
        <div className="relative h-[600px] w-full overflow-hidden rounded-[32px] bg-bg">
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-full w-full overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  )
}
