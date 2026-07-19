export default function VegIcon({ isVeg }) {
  return (
    <div className={`w-4 h-4 shrink-0 rounded-sm border-2 flex items-center justify-center ${isVeg ? "border-green-500" : "border-red-500"}`}>
      <div className={`w-2 h-2 rounded-full ${isVeg ? "bg-green-500" : "bg-red-500"}`} />
    </div>
  );
}