import Image from "next/image";

export function Header() {
  return (
    <header className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#1a1a1a] border border-gray-700/60 backdrop-blur-sm shadow-lg">
            <Image
              src="/kernel-logo.svg"
              alt="Kernel"
              width={80}
              height={15}
              priority
              className="h-4 w-auto"
            />
            <span className="text-gray-600">|</span>
            <span className="text-[10px] font-medium tracking-wider text-gray-500 uppercase">
              Powered by AI Infra
            </span>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 76 76"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
              </svg>
              <span className="text-xs font-semibold text-white">Vercel</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
