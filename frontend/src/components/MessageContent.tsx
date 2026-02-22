import React from 'react';

interface MessageContentProps {
    content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
    // Simple regex to find ==text== and wrap in a highlighted span
    const parts = content.split(/(==.*?==)/g);

    return (
        <p className="text-sm">
            {parts.map((part, i) => {
                if (part.startsWith('==') && part.endsWith('==')) {
                    return (
                        <span key={i} className="bg-yellow-200 text-gray-900 px-1 rounded font-bold">
                            {part.slice(2, -2)}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );
};

export default MessageContent;
