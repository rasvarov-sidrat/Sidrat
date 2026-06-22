import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';
import { ReferralNode } from '@/types';

interface CascadeTreeProps {
  nodes: ReferralNode[];
  maxDepth?: number;
}

export default function CascadeTree({ nodes, maxDepth = 3 }: CascadeTreeProps) {
  const renderNode = (node: ReferralNode, depth: number = 0) => {
    if (depth > maxDepth) return null;

    return (
      <div key={node.userId} className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: depth * 0.2 }}
          className="flex items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm mb-2"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="w-8 h-8 rounded-full bg-[#2A7F6E]/10 flex items-center justify-center">
            <User className="w-4 h-4 text-[#2A7F6E]" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{node.user.name}</p>
            <p className="text-xs text-gray-500">Уровень {depth + 1}</p>
          </div>
          {node.children.length > 0 && (
            <div className="ml-auto flex items-center text-[#C5A059]">
              <Users className="w-3 h-3 mr-1" />
              <span className="text-xs">{node.children.length}</span>
            </div>
          )}
        </motion.div>

        {node.children.length > 0 && (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Пока нет приглашённых участников</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h4 className="font-medium text-gray-900 mb-4">Древовидная структура приглашений</h4>
      <div className="space-y-1">
        {nodes.map((node) => renderNode(node))}
      </div>
    </div>
  );
}