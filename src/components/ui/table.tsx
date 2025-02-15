export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto">
    <table className={className} {...props} />
  </div>
);

export const TableHeader = ({ ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props} />;

export const TableBody = ({ ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} />;

export const TableRow = ({ ...props }: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />;

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={className} {...props} />
);

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={className} {...props} />
); 