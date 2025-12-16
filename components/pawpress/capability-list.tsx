interface Capability {
  title: string;
  description: string;
}

interface CapabilityListProps {
  capabilities: Capability[];
}

export function CapabilityList({ capabilities }: CapabilityListProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {capabilities.map((capability, index) => (
        <div
          key={index}
          className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
        >
          <h3 className="text-xl font-semibold text-white mb-3">
            {capability.title}
          </h3>
          <p className="text-gray-400">
            {capability.description}
          </p>
        </div>
      ))}
    </div>
  );
}
