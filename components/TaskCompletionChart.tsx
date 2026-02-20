'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLanguage } from './LanguageProvider'

interface TaskCompletionChartProps {
    data: {
        date: string
        completed: number
        pending: number
    }[]
}

export default function TaskCompletionChart({ data }: TaskCompletionChartProps) {
    const { t } = useLanguage()
    return (
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('familyPortal.taskCompletionHistory')}</h3>
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -10,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f3f4f6' }}
                        />
                        <Bar dataKey="completed" name={t('common.completed')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                        <Bar dataKey="pending" name={t('common.pending')} fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
