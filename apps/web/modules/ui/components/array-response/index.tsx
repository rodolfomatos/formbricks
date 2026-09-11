/**
 * Renders an array of strings as a stacked list of lines.
 * Used to display multi-value survey responses (e.g. multi-select answers).
 */
interface ArrayResponseProps {
  value: string[];
}

export const ArrayResponse = ({ value }: ArrayResponseProps) => {
  return (
    <div className="my-1 font-normal text-slate-700" dir="auto">
      {value.map(
        (item, index) =>
          item && (
            <div key={`${index}-${item}`}>
              {item}
              <br />
            </div>
          )
      )}
    </div>
  );
};
