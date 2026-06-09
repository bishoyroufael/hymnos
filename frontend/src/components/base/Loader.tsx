interface LoaderProps {
  message?: string;
}

export default function Loader({ message }: LoaderProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        {/* Coptic Logo */}
        <div className="text-5xl font-bold text-base-content text-shadow-lg animate-pulse">ϩⲩⲙⲛⲟⲥ</div>

        {/* DaisyUI Loading Spinner */}
        <span className="loading loading-dots loading-sm"></span>

        {/* Message */}
        {message && <p className="text-md text-base-content/50">{message}</p>}
      </div>
    </div>
  );
}
