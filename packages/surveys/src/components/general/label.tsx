/** Label — renders a simple survey field label with `htmlFor` association and subheading styling. */
interface LabelProps {
  text: string;
  htmlForId?: string;
}

export function Label({ text, htmlForId }: Readonly<LabelProps>) {
  return (
    <label htmlFor={htmlForId} className="text-subheading block text-sm font-normal" dir="auto">
      {text}
    </label>
  );
}
