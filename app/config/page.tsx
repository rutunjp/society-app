import ConfigForm from "@/components/ConfigForm"
import Nav from "@/components/Nav"

export const metadata = {
  title: "Society Configuration | SocietyApp",
  description: "Configure society details, governing body, and executive members",
}

export default function ConfigPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen pb-20 md:pb-0 font-sans bg-slate-50">
      <Nav />
      <main className="flex-1 p-4 md:p-8 lg:px-12 overflow-hidden max-w-7xl mx-auto w-full">
        <div className="mb-10 mt-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Society Configuration</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Manage your society's official profile, board members, and committee details.
          </p>
        </div>

        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          <ConfigForm />
        </section>
      </main>
    </div>
  )
}
