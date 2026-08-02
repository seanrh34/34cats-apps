interface Capability {
  title: string;
  description: string;
}

interface CapabilityListProps {
  capabilities: Capability[];
}

export function CapabilityList({ capabilities }: CapabilityListProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {capabilities.map((capability) => (
        <div key={capability.title} className="portal-panel p-5">
          <dt className="portal-heading text-lg text-copy">{capability.title}</dt>
          <dd className="mt-2 text-sm leading-relaxed text-copy-muted">{capability.description}</dd>
        </div>
      ))}
    </dl>
  );
}
