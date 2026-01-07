"use client"

import React, { useState } from 'react'
import { Card, Button, Input } from './ui-glass'
import { Plus, Minus, DollarSign, Wallet, CheckCircle2, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

const transactionFormSchema = z.object({
    amount: z.string()
        .min(1, 'El monto es requerido')
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Ingresa un monto válido mayor a 0'),
    description: z.string()
        .min(3, 'La descripción debe tener al menos 3 caracteres')
        .max(100, 'La descripción no puede exceder 100 caracteres'),
    currency: z.enum(['ARS', 'USD']),
    frequency: z.enum(['VARIABLE', 'FIXED']),
    incomeType: z.enum(['BLANCO', 'NEGRO']).optional(),
    isPaid: z.boolean(),
    isSavings: z.boolean().optional(),
})

type TransactionFormData = z.infer<typeof transactionFormSchema>

export const TransactionForm = ({ type = 'EXPENSE', onSuccess }: { type?: 'EXPENSE' | 'INCOME', onSuccess?: () => void }) => {
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE')
    const toast = useToast()
    const router = useRouter()

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            amount: '',
            description: '',
            currency: 'ARS',
            frequency: 'VARIABLE',
            incomeType: 'BLANCO',
            isPaid: false,
            isSavings: false,
        }
    })

    const isPaid = watch('isPaid')
    const isSavings = watch('isSavings')
    const frequency = watch('frequency')
    const incomeType = watch('incomeType')
    const currency = watch('currency')

    function normalizeNumberInput(input: string) {
        // Keep only digits, dots and commas
        let s = String(input || '').replace(/[^0-9.,]/g, '')
        if (!s) return ''

        // Normalize commas to dots (treat comma as decimal separator)
        s = s.replace(/,/g, '.')

        const dotCount = (s.match(/\./g) || []).length

        if (dotCount > 1) {
            // Remove all dots except the last (they were thousand separators)
            const lastIndex = s.lastIndexOf('.')
            const intPart = s.slice(0, lastIndex).replace(/\./g, '')
            const fracPart = s.slice(lastIndex + 1)
            return fracPart ? `${intPart}.${fracPart}` : intPart
        }

        if (dotCount === 1) {
            const [intPart, fracPart] = s.split('.')
            // Heuristic: if fractional part has exactly 3 digits, it's likely a thousand separator
            if (fracPart.length === 3) {
                return `${intPart}${fracPart}`
            }
            return fracPart ? `${intPart}.${fracPart}` : intPart
        }

        return s
    }

    const onSubmit = async (data: TransactionFormData) => {
        setStatus('LOADING')

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                        // normalize before sending
                        amount: parseFloat(normalizeNumberInput(data.amount)),
                    description: data.description,
                    currency: data.currency,
                    type,
                    frequency: data.frequency,
                    incomeType: type === 'INCOME' ? data.incomeType : null,
                    isPaid: type === 'EXPENSE' ? data.isPaid : true,
                    isSavings: !!data.isSavings
                })
            })

            if (res.ok) {
                setStatus('SUCCESS')
                toast.success(
                    `${type === 'INCOME' ? 'Ingreso' : 'Gasto'} registrado`,
                    `Se ha registrado correctamente ${data.description}`
                )

                // Refresh sin reload completo
                setTimeout(() => {
                    router.refresh()
                    if (onSuccess) {
                        onSuccess()
                    } else {
                        setStatus('IDLE')
                    }
                }, 1500)
            } else {
                const error = await res.json()
                toast.error('Error al registrar', error.message || 'Intenta nuevamente')
                setStatus('IDLE')
            }
        } catch (error) {
            toast.error('Error de conexión', 'No se pudo conectar con el servidor')
            setStatus('IDLE')
            console.error(error)
        }
    }

    if (status === 'SUCCESS') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)]"
                >
                    <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <div className="space-y-2">
                    <h3 className="text-3xl font-bold tracking-tight">¡Operación Exitosa!</h3>
                    <p className="text-white/40 font-medium">Actualizando tu centro de control...</p>
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500/40" />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                <div className={`p-3 rounded-xl ${type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {type === 'INCOME' ? <Wallet size={24} /> : <Minus size={24} />}
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1">Registrar</p>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {type === 'INCOME' ? 'Nuevo Ingreso' : 'Nuevo Gasto'}
                    </h2>
                </div>
            </div>

            {/* Main Entry Section */}
            <div className="space-y-6">
                {/* Amount Entry */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Monto</label>
                    <div className={`flex items-center gap-3 p-6 ${errors.amount ? 'bg-rose-500/5 border-rose-500/30' : 'bg-white/[0.02] border-white/10'} border rounded-2xl focus-within:border-white/20 focus-within:bg-white/[0.04] transition-all`}>
                        <span className="text-2xl font-light text-white/30">{currency === 'USD' ? 'U$D' : '$'}</span>
                        {/* Controlled text input to format thousands with dots while keeping raw value in form state */}
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={(() => {
                                const raw = (watch('amount') || '') as string
                                // Keep empty
                                if (raw === '') return ''
                                // Remove any non digit or dot (we store raw with dot as decimal separator)
                                const cleaned = String(raw).replace(/[^0-9.]/g, '')
                                const parts = cleaned.split('.')
                                const intPart = parts[0]
                                const fracPart = parts[1]
                                // add dot as thousand separator
                                const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                return fracPart !== undefined ? `${withSep}.${fracPart}` : withSep
                            })()}
                            onChange={(e) => {
                                // Accept digits and dot. Remove thousand separators from incoming value
                                const incoming = e.target.value
                                // allow only digits and dot
                                const filtered = incoming.replace(/[^0-9.]/g, '')
                                // ensure at most one dot
                                const parts = filtered.split('.')
                                const raw = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0]
                                setValue('amount', raw, { shouldValidate: true, shouldDirty: true })
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-4xl font-bold tracking-tighter text-white placeholder:text-white/10 font-mono"
                            autoFocus
                            aria-invalid={errors.amount ? "true" : "false"}
                            aria-describedby={errors.amount ? "amount-error" : undefined}
                        />
                        <select
                            {...register('currency')}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 outline-none cursor-pointer transition-all"
                        >
                            <option value="ARS" className="bg-zinc-900">ARS</option>
                            <option value="USD" className="bg-zinc-900">USD</option>
                        </select>
                    </div>
                    {errors.amount && (
                        <p id="amount-error" className="text-rose-400 text-xs ml-1" role="alert">
                            {errors.amount.message}
                        </p>
                    )}
                </div>

                {/* Concept Input */}
                <div className="space-y-2">
                    <Input
                        label="Concepto / Descripción"
                        placeholder="Ej: Supermercado, Alquiler, Sueldo..."
                        {...register('description')}
                        error={errors.description?.message}
                        id="description"
                        aria-required="true"
                    />
                </div>

                {/* Classification Toggles */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Clasificación</label>
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                        {type === 'EXPENSE' ? (
                            <>
                                <TypeButton
                                    active={frequency === 'VARIABLE'}
                                    onClick={() => setValue('frequency', 'VARIABLE')}
                                    label="Adicional"
                                    icon={<Sparkles size={14} />}
                                />
                                <TypeButton
                                    active={frequency === 'FIXED'}
                                    onClick={() => setValue('frequency', 'FIXED')}
                                    label="Fijo Mensual"
                                />
                            </>
                        ) : (
                            <>
                                <TypeButton
                                    active={incomeType === 'BLANCO'}
                                    onClick={() => setValue('incomeType', 'BLANCO')}
                                    label="En Blanco"
                                    color="emerald"
                                />
                                <TypeButton
                                    active={incomeType === 'NEGRO'}
                                    onClick={() => setValue('incomeType', 'NEGRO')}
                                    label="En Negro"
                                    color="emerald"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Payment Status (Only for Expenses) */}
                {type === 'EXPENSE' && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Estado de Pago</label>
                        <button
                            type="button"
                            onClick={() => setValue('isPaid', !isPaid)}
                            className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${isPaid
                                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]'
                                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                                }`}
                            aria-pressed={isPaid}
                            aria-label={isPaid ? 'Marcado como pagado' : 'Marcado como pendiente'}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                                    }`}>
                                    {isPaid && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-white"
                                        >
                                            <CheckCircle2 size={16} />
                                        </motion.div>
                                    )}
                                </div>
                                <span className={`text-sm font-bold ${isPaid ? 'text-emerald-400' : 'text-white/60'}`}>
                                    {isPaid ? 'Pagado' : 'Pendiente de Pago'}
                                </span>
                            </div>
                            {isPaid && (
                                <span className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-wider">✓ Confirmado</span>
                            )}
                        </button>
                    </div>
                )}

                {/* Savings toggle (for expenses and incomes) */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Ahorro</label>
                    <button
                        type="button"
                        onClick={() => setValue('isSavings', !isSavings)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${isSavings
                            ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.12)]'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                            }`}
                        aria-pressed={isSavings}
                        aria-label={isSavings ? 'Marcado como ahorro' : 'No marcado como ahorro'}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSavings ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'}`}>
                                {isSavings && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-white"
                                    >
                                        <CheckCircle2 size={16} />
                                    </motion.div>
                                )}
                            </div>
                            <span className={`text-sm font-bold ${isSavings ? 'text-blue-400' : 'text-white/60'}`}>
                                Marcar como Ahorro
                            </span>
                        </div>
                        {isSavings && (
                            <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-wider">Guardado</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
                <Button
                    type="submit"
                    fullWidth
                    variant={type === 'INCOME' ? 'glow' : 'primary'}
                    disabled={status === 'LOADING'}
                    className="h-16 rounded-2xl"
                    ariaLabel={`Confirmar ${type === 'INCOME' ? 'ingreso' : 'gasto'}`}
                >
                    {status === 'LOADING' ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            Confirmar Operación
                            <ArrowRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
                <p className="text-center text-[10px] text-white/20 mt-6 tracking-widest uppercase font-bold">Resumen de cuenta se actualizará al confirmar</p>
            </div>
        </form>
    )
}

function TypeButton({ active, onClick, label, color = 'blue', icon }: any) {
    const colors: any = {
        blue: active ? 'bg-white text-black' : 'text-white/40 hover:text-white',
        emerald: active ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-emerald-400'
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-500 ${colors[color]} ${active ? 'shadow-xl' : 'hover:bg-white/5'}`}
        >
            {icon}
            {label}
        </button>
    )
}
