export default function Container({ as: Tag = 'div', className = '', children }) {
  return <Tag className={`mx-auto w-full max-w-content px-5 sm:px-8 ${className}`}>{children}</Tag>
}
