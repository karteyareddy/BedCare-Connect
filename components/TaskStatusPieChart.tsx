'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useLanguage } from './LanguageProvider'

interface TaskStatusPieChartProps {
    completed: number
    pending: number
}

export default function TaskStatusPieChart({ completed, pending }: TaskStatusPieChartProps) {
    const { t } = useLanguage()
    const data = [
        { name: t('common.completed'), value: completed, color: '#10b981' }, // Green
        { name: t('common.pending'), value: pending, color: '#fbbf24' },   // Yellow
    ]

    // Calculate total for center text
    const total = completed + pending
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('common.taskStatusOverview')}</h3>
            <div className="relative h-[220px] w-full">
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

                {/* Center Text — offset up to clear the legend */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-3xl font-bold text-gray-800">{completionRate}%</p>
                    <p className="text-xs text-gray-500 font-medium">{t('common.completed')}</p>
                </div>
            </div>
        </div>
    )
}
