import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';

interface Contribution {
  amount: number;
  date: string;
  note?: string;
}

interface ContributionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalName: string;
  contributions: Contribution[];
}

export const ContributionHistoryDialog: React.FC<ContributionHistoryDialogProps> = ({
  open,
  onOpenChange,
  goalName,
  contributions,
}) => {
  // Sort contributions by date (newest first)
  const sortedContributions = [...contributions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Calculate total contributions
  const totalContributions = contributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Savings History for &quot;{goalName}&quot;</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Total Summary */}
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-600">Total Contributions</p>
            <p className="text-2xl font-bold">{formatCurrency(totalContributions)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Contributions Table */}
          {sortedContributions.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContributions.map((contribution, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(contribution.date)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(contribution.amount)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {contribution.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No contributions yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

