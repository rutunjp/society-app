export default function StatusBadge({ status }: { status: string }) {
  const isPaid = status?.toLowerCase() === "paid"
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPaid
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {isPaid ? "✓ Paid" : "⏳ Pending"}
    </span>
  )
}
