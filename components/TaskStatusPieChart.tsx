'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface TaskStatusPieChartProps {
    completed: number
    pending: number
}

export default function TaskStatusPieChart({ completed, pending }: TaskStatusPieChartProps) {
    const data = [
        { name: 'Completed', value: completed, color: '#10b981' }, // Green
        { name: 'Pending', value: pending, color: '#fbbf24' },   // Yellow
    ]

    // Calculate total for center text
    const total = completed + pending
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
        <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 self-start w-full">Overall Status</h3>
            <div className="relative w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-4 text-center">
                    <p className="text-3xl font-bold text-gray-800">{completionRate}%</p>
                    <p className="text-xs text-gray-500 font-medium">Completed</p>
                </div>
            </div>
        </div>
    )
}
