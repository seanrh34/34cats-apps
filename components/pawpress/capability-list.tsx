interface Capability {
  title: string;
  description: string;
}

interface CapabilityListProps {
  capabilities: Capability[];
}

export function CapabilityList({ capabilities }: CapabilityListProps) {
  return (
    <div className="grid gap-px bg-line sm:grid-cols-2">
      {capabilities.map((capability) => (
        <div key={capability.title} className="bg-ink p-6">
          <h3 className="font-display text-xl text-bone">{capability.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ash">
            {capability.description}
          </p>
        </div>
      ))}
    </div>
  );
}
