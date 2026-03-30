export default function StatusBadge({ status }: { status: "paid" | "pending" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === "paid"
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {status === "paid" ? "✓ Paid" : "⏳ Pending"}
    </span>
  )
}
