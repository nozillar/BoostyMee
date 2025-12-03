import React, { useState } from 'react';
import { breakDownTask } from '../services/geminiService';
import { TaskStep } from '../types';
import { Button } from './Button';
import { Layers, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export const TaskBreaker: React.FC = () => {
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setSteps([]);

    try {
      const result = await breakDownTask(input);
      setSteps(result);
    } catch (err) {
      setError('Failed to break down the task. Try being more specific.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Task Breaker</h2>
        <p className="text-gray-500">Overwhelmed? Enter a big task, and we'll break it into bite-sized pieces.</p>
      </div>

      <form onSubmit={handleBreakdown} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
            What do you need to get done?
          </label>
          <div className="relative">
            <input
              type="text"
              id="task"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Plan a marketing campaign, Clean the garage..."
              className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" isLoading={loading} disabled={!input.trim()}>
            Break It Down <Layers className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Your Action Plan</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {steps.length} Steps
            </span>
          </div>
          
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-base font-semibold text-gray-900 truncate pr-4">
                        {step.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <Clock className="h-3 w-3 mr-1" />
                        {step.duration}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => {
                setSteps([]);
                setInput('');
            }}>
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};