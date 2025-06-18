import { RiSearchLine } from 'react-icons/ri';

export const LayoutListNoResults = () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
          <RiSearchLine className="h-6 w-6 text-neutral-600" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground-950 font-medium">No layouts found</h3>
          <p className="text-foreground-600 text-sm">Try adjusting your search to find what you're looking for.</p>
        </div>
      </div>
    </div>
  );
};
