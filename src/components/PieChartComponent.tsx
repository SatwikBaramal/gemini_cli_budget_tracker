"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Expense {
  name: string;
  amount: number;
}

interface PieChartComponentProps {
  expenses: Expense[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const CustomLabel = (props: any) => {
    const { x, y, textAnchor, dominantBaseline, name, percent, fill } = props;
    return (
        <text x={x} y={y} textAnchor={textAnchor} dominantBaseline={dominantBaseline} fill={fill} fontSize={12}>
            {`${name} ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const PieChartComponent: React.FC<PieChartComponentProps> = ({ expenses }) => {
  const data = expenses.map((expense) => ({
    name: expense.name,
    value: expense.amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={<CustomLabel />}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;