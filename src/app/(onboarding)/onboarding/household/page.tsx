import { saveHouseholdSize } from "@/applications/user/application/useCases/saveHouseholdSize";

const sizes = [
  { value: "1", number: "1", label: "Solo" },
  { value: "2", number: "2", label: "En couple" },
  { value: "3", number: "3", label: "Famille" },
  { value: "4", number: "4+", label: "Grande famille" },
];

export default function HouseholdPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white px-6 pb-10">
      <div className="relative mb-10 mt-2">
        <h1 className="text-[28px] font-black leading-tight tracking-tight text-gray-900 animate-fade-up [animation-delay:80ms]">
          Pour combien<br />cuisinez-vous ?
        </h1>
        <p className="mt-2 text-sm text-gray-400 animate-fade-up [animation-delay:160ms]">
          On adaptera les portions de vos recettes.
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3">
        {sizes.map(({ value, number, label }, index) => (
          <form
            key={value}
            action={saveHouseholdSize}
            className="animate-scale-in"
            style={{ animationDelay: `${280 + index * 70}ms` }}
          >
            <input type="hidden" name="size" value={value} />
            <button
              type="submit"
              className="group w-full rounded-3xl border-2 border-gray-100 bg-white p-6 text-left shadow-sm transition-all duration-150 hover:border-primary hover:shadow-md hover:shadow-primary/10 active:scale-95"
            >
              <span className="block text-[56px] font-black leading-none tracking-tighter text-gray-900 transition-colors group-hover:text-primary">
                {number}
              </span>
              <span className="mt-3 block text-[11px] font-bold uppercase tracking-widest text-gray-400 transition-colors group-hover:text-primary">
                {label}
              </span>
            </button>
          </form>
        ))}
      </div>

    </div>
  );
}
