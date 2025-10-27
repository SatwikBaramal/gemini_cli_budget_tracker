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
  type: 'addition' | 'withdrawal';
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

  // Calculate net contributions (additions - withdrawals)
  const totalAdditions = contributions
    .filter((c) => c.type === 'addition')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  
  const totalWithdrawals = contributions
    .filter((c) => c.type === 'withdrawal')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  
  const netContributions = totalAdditions - totalWithdrawals;

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
          <div className="bg-gray-100 p-4 rounded-md space-y-2">
            <div>
              <p className="text-sm text-gray-600">Net Savings</p>
              <p className="text-2xl font-bold">{formatCurrency(netContributions)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-gray-600">Total Added</p>
                <p className="text-sm font-semibold text-green-600">
                  +{formatCurrency(totalAdditions)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Withdrawn</p>
                <p className="text-sm font-semibold text-red-600">
                  -{formatCurrency(totalWithdrawals)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 pt-2">
              {contributions.length} transaction{contributions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Contributions Table */}
          {sortedContributions.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContributions.map((contribution, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(contribution.date)}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            contribution.type === 'addition'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {contribution.type === 'addition' ? 'Added' : 'Withdrawn'}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          contribution.type === 'addition'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {contribution.type === 'addition' ? '+' : '-'}
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

