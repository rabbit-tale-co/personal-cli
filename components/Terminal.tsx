'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'system' | 'image' | 'link';
  content: string;
  timestamp?: string;
  id?: string;
  imageData?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  linkData?: {
    url: string;
    text: string;
  };
}

interface TerminalProps {
  initialRoute?: string;
}

const Terminal = ({ initialRoute }: TerminalProps) => {
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string | null>(initialRoute || null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ cmd: string; desc: string; }[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const router = useRouter();

  const username = 'visitor';
  const hostname = 'kris.rabbittale.co';
  const currentPath = currentRoute ? `~/portfolio/${currentRoute}` : '~/portfolio';

  // Calculate age automatically
  const calculateAge = () => {
    const birthDate = new Date('2001-07-11');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const calculateSkillLevel = () => {
    const startYear = 2016;
    const currentYear = new Date().getFullYear();
    return currentYear - startYear;
  };

  const generateProgressBar = (percentage: number, length: number = 20) => {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // Available commands for autocomplete with descriptions
  const availableCommands = [
    { cmd: 'home', desc: 'Go to home page' },
    { cmd: 'about', desc: 'Learn about me' },
    { cmd: 'skills', desc: 'View my skills & expertise' },
    { cmd: 'projects', desc: 'Browse my projects' },
    { cmd: 'contact', desc: 'Get in touch with me' },
    { cmd: 'social', desc: 'Find me on social media' },
    { cmd: 'help', desc: 'Show available commands' },
    { cmd: 'clear', desc: 'Clear the terminal' },
    { cmd: 'neofetch', desc: 'Display system information' },
    { cmd: 'banner', desc: 'Show welcome banner' },
    { cmd: 'quote', desc: 'Random design quote' },
    { cmd: 'whoami', desc: 'Current user info' },
    { cmd: 'pwd', desc: 'Show current path' },
    { cmd: 'back', desc: 'Go back to previous page' },
    { cmd: 'cd ..', desc: 'Navigate back' },
    { cmd: 'projects fullstack', desc: 'View fullstack projects' },
    { cmd: 'projects backend', desc: 'View backend projects' },
    { cmd: 'projects gamedev', desc: 'View game development projects' },
    { cmd: 'projects design', desc: 'View design projects' }
  ];

  // Generate suggestions based on input
  const getSuggestions = (input: string) => {
    if (!input.trim()) return [];

    const filtered = availableCommands.filter(item =>
      item.cmd.toLowerCase().startsWith(input.toLowerCase())
    );

    return filtered.slice(0, 5); // Limit to 5 suggestions
  };

  // Handle input change and update suggestions
  const handleInputChange = (value: string) => {
    setInput(value);
    const newSuggestions = getSuggestions(value);
    setSuggestions(newSuggestions);
    const shouldShow = newSuggestions.length > 0 && value.trim().length > 0;
    setShowSuggestions(shouldShow);
    setSelectedSuggestion(shouldShow ? 0 : -1);
  };

  // Function to colorize text based on content
  const colorizeText = (text: string) => {
    // Don't colorize if it contains LINK (will be handled by parseTextWithLinks)
    if (text.includes('LINK:')) {
      return text;
    }

    // Special handling for section headers (ends with colon)
    if (text.endsWith(':') && !text.includes('   ')) {
      // Section headers get special accent color
      return <span className="text-accent font-bold">{text}</span>;
    }

    // Color patterns for content with emojis
    const patterns = [
      { regex: /^(🔥|🚀|⭐|✨|💫)/g, className: 'text-orange' },
      { regex: /^(🎮|🎯|🎨|🎪|🎭)/g, className: 'text-pink' },
      { regex: /^(💻|🖥️|⚡|🔧|🛠️)/g, className: 'text-cyan' },
      { regex: /^(📱|📊|📈|📋|📝)/g, className: 'text-purple' },
      { regex: /^(🌟|⏰|🏆|🎯|✅)/g, className: 'text-yellow' },
      { regex: /^(❤️|💭|🤝|👋|🎂)/g, className: 'text-coral' },
      { regex: /^(🌍|🌐|🔗)/g, className: 'text-mint' },
      { regex: /^(🕹️|🎲|🎪|🎨|🎭)/g, className: 'text-lime' },
      // Special cases for location and professional that shouldn't be mint
      { regex: /^(📍)/g, className: 'text-yellow' },
      { regex: /^(💼)/g, className: 'text-purple' },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        return <span className={pattern.className}>{text}</span>;
      }
    }

    return text;
  };

  // Function to get filtered projects by category
  const getFilteredProjects = (category: string) => {
    const projects = [
      {
        name: 'CloneTheOn',
        type: 'Web App',
        category: 'fullstack',
        tech: 'T3 Stack, AI',
        status: 'Live',
        description: 'AI-powered chat application',
        link: 'https://t3.rabbittale.co'
      },
      {
        name: 'TinyRabbit Bot',
        type: 'Discord Bot',
        category: 'backend',
        tech: 'Node.js, Discord.js',
        status: 'Live',
        description: 'Advanced fun & utility bot',
        link: 'https://github.com/rabbit-tale-co/discord-tinyRabbit'
      },
      {
        name: 'TinyBuddies',
        type: 'Mobile Game',
        category: 'gamedev',
        tech: 'Unity, C#',
        status: 'In Dev',
        description: 'Tamagotchi-like companion game',
        link: null
      },
      {
        name: 'SoundLess',
        type: 'Horror Game',
        category: 'gamedev',
        tech: '3D Audio, Unity',
        status: 'In Dev',
        description: '3D echolocation horror experience',
        link: null
      },
      {
        name: 'WhiteFox Design',
        type: 'Portfolio',
        category: 'design',
        tech: 'HTML, CSS, JS',
        status: 'Live',
        description: 'Professional logo design services',
        link: 'https://whitefoxdesigns.net'
      }
    ];

    const validCategories = ['fullstack', 'backend', 'gamedev', 'design'];

    if (!validCategories.includes(category)) {
      return [
        '❌ Invalid category!',
        '',
        '📂 Available categories:',
        '   • fullstack - Full-stack web applications',
        '   • backend   - Server-side applications & bots',
        '   • gamedev   - Game development projects',
        '   • design    - Design & portfolio projects',
        '',
        '💡 Usage: projects <category>'
      ];
    }

    const filtered = projects.filter(p => p.category === category);

    if (filtered.length === 0) {
      return [`No projects found in category: ${category}`];
    }

    const result = [
      `╭─────────────────────────────────────────────────────────────────────────╮`,
      `│                      PROJECTS - ${category.toUpperCase().padEnd(9)}                      │`,
      `╰─────────────────────────────────────────────────────────────────────────╯`,
      '',
      '┌─────────────────┬──────────────┬─────────┬──────────────────────────┐',
      '│ Project         │ Type         │ Status  │ Description              │',
      '├─────────────────┼──────────────┼─────────┼──────────────────────────┤'
    ];

    filtered.forEach(project => {
      const name = project.name.length > 15 ? project.name.substring(0, 12) + '...' : project.name.padEnd(15);
      const type = project.type.length > 12 ? project.type.substring(0, 9) + '...' : project.type.padEnd(12);
      const status = project.status.padEnd(7);
      const desc = project.description.length > 24 ?
        project.description.substring(0, 21) + '...' :
        project.description.padEnd(24);

      result.push(`│ ${name} │ ${type} │ ${status} │ ${desc} │`);
    });

    result.push('└─────────────────┴──────────────┴─────────┴──────────────────────────┘');
    result.push('');
    result.push('🔗 Links:');

    filtered.forEach(project => {
      if (project.link) {
        result.push(`   ${project.name}: LINK:${project.link}`);
      }
    });

    result.push('');
    return result;
  };

  // Function to parse text and convert LINK: format to JSX with colorization
  const parseTextWithLinks = (text: string) => {
    // Handle LINK: format first
    if (text.includes('LINK:')) {
      const linkRegex = /LINK:((?:https?:\/\/|mailto:)[^\s:]+)(?::(.+?))?(?=\s|$)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(text)) !== null) {
        // Add text before the link (with colorization)
        if (match.index > lastIndex) {
          const beforeText = text.substring(lastIndex, match.index);
          parts.push(colorizeText(beforeText));
        }

        // Add the link
        const url = match[1];
        const displayText = match[2] || url.replace('https://', '').replace('http://', '');

        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-prompt hover:text-accent transition-colors duration-200 cursor-pointer underline decoration-dotted hover:decoration-solid inline-block"
            style={{
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              pointerEvents: 'auto',
              zIndex: 10,
              position: 'relative'
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (url.startsWith('http://') || url.startsWith('https://')) {
                window.open(url, '_blank', 'noopener,noreferrer');
              } else if (url.startsWith('mailto:')) {
                window.location.href = url;
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--terminal-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--terminal-prompt)';
            }}
          >
            {displayText}
          </a>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text after the last link
      if (lastIndex < text.length) {
        const afterText = text.substring(lastIndex);
        parts.push(colorizeText(afterText));
      }

      return <>{parts}</>;
    }

    // Handle standalone email addresses
    if (text.includes('@') && text.includes('.') && !text.includes('LINK:')) {
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = emailRegex.exec(text)) !== null) {
        // Add text before email
        if (match.index > lastIndex) {
          const beforeText = text.substring(lastIndex, match.index);
          parts.push(colorizeText(beforeText));
        }

        // Add email as mailto link
        const email = match[1];
        parts.push(
          <a
            key={match.index}
            href={`mailto:${email}`}
            className="text-blue hover:text-cyan underline transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {email}
          </a>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        parts.push(colorizeText(remainingText));
      }

      return <>{parts}</>;
    }

    // No links or emails, just colorize the text
    return colorizeText(text);
  };

  const routes = useMemo(() => ({
    home: () => [
      `👋 Hey! I'm Kris German, ${calculateAge()} years old UI/UX Designer`,
      '',
      '🎨 What I do:',
      `   • UI/UX Design since 2016 (${calculateSkillLevel()}+ years experience)`,
      '   • Create beautiful, user-centered interfaces',
      '   • Build intermediate web applications',
      '   • Figma wizard & design systems enthusiast',
      '',
      '💻 Tech Stack:',
      '   • Design: Figma',
      '   • Frontend: React, Next.js, TypeScript',
      '   • Styling: Tailwind CSS, CSS3, SCSS',
      '   • Backend: Still learning... it\'s my nemesis 😅',
      '',
      '🚀 Available Commands:',
      '   about     skills     projects     contact',
      '   social    help       clear        neofetch',
      '',
      '💡 Tip: Use ↑↓ arrows to navigate command history',
      ''
    ],

    about: () => [
      'ABOUT ME',
      '',
      `👋 Name: Kris German`,
      `🎂 Age: ${calculateAge()} years old`,
      `📅 Born: ${new Date('2001-07-11').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      '📍 Location: Poland 🇵🇱',
      '',
      '🎨 Professional:',
      `   💼 UI/UX Designer with ${calculateSkillLevel()}+ years experience`,
      '   🚀 Started designing in 2016',
      '   🛠️ Expert in Figma, Adobe Creative Suite',
      '   📱 Specialized in mobile & web interfaces',
      '   ✨ Philosophy: Beautiful meets functional',
      '',
      '💻 Technical Skills:',
      '   🎯 Frontend: HTML, CSS, JS, React, TypeScript',
      '   🔧 Backend: Node.js, Bun (learning)',
      '   🗄️ Database: Supabase (learning)',
      '   🖥️ Server: Linux administration (intermediate)',
      '   🏆 Goal: Full-stack mastery',
      '',
      '🎮 Personal Interests:',
      '   🕹️ Passionate gamer - love exploring new worlds',
      '   🎯 Game development enthusiast',
      '   🚀 Currently working on my own indie games',
      '   🎨 Combining design skills with game creation',
      '   🌟 Always learning new technologies',
      '',
      '✅ Status: Available for freelance work',
      '💭 Motto: "User-first design, always"',
      '🌍 Timezone: CET (UTC+1)',
      ''
    ],

    skills: () => [
      'SKILLS & EXPERTISE',
      '',
      '🎨 Design Skills:',
      `  UI/UX Design     ${generateProgressBar(95)} 95% (${calculateSkillLevel()} years)`,
      `  Figma            ${generateProgressBar(90)} 90% (Expert)`,
      `  Prototyping      ${generateProgressBar(75)} 75% (Advanced)`,
      '',
      '💻 Development Skills:',
      `  Frontend Dev     ${generateProgressBar(75)} 75% (Intermediate+)`,
      `  React/Next.js    ${generateProgressBar(70)} 70% (Intermediate)`,
      `  TypeScript       ${generateProgressBar(65)} 65% (Learning)`,
      `  HTML/CSS         ${generateProgressBar(80)} 80% (Advanced)`,
      `  JavaScript       ${generateProgressBar(70)} 70% (Intermediate)`,
      '',
      '🖥️ Technical Skills:',
      `  Linux Server     ${generateProgressBar(50)} 50% (Intermediate)`,
      `  Git/GitHub       ${generateProgressBar(75)} 75% (Advanced)`,
      `  Backend Dev      ${generateProgressBar(35)} 35% (Struggling 😅)`,
      `  Database         ${generateProgressBar(30)} 30% (Learning)`,
      '',
      '🛠️ Tools & Technologies:',
      '  Design: Figma, Adobe XD, Photoshop, Illustrator',
      '  Development: VS Code, React, TypeScript, Node.js',
      '  Other: Git, Linux, Terminal, Unity, Blender',
      '',
      `📈 Learning Goals ${new Date().getFullYear()}:`,
      '  🎯 Master backend development',
      '  🔥 Advanced TypeScript patterns',
      '  🗄️ Database optimization',
      '  🚀 DevOps & deployment',
      '  🎮 Game development with Unity',
      ''
    ],

    projects: () => {
      const projects = [
        {
          name: 'CloneTheOn',
          type: 'Web App',
          category: 'fullstack',
          tech: 'T3 Stack, AI',
          status: 'Live',
          description: 'AI-powered chat application',
          link: 'https://t3.rabbittale.co'
        },
        {
          name: 'TinyRabbit Bot',
          type: 'Discord Bot',
          category: 'backend',
          tech: 'Node.js, Discord.js',
          status: 'Live',
          description: 'Advanced fun & utility bot',
          link: 'https://github.com/rabbit-tale-co/discord-tinyRabbit'
        },
        {
          name: 'TinyBuddies',
          type: 'Mobile Game',
          category: 'gamedev',
          tech: 'Unity, C#',
          status: 'In Dev',
          description: 'Tamagotchi-like companion game',
          link: null
        },
        {
          name: 'SoundLess',
          type: 'Horror Game',
          category: 'gamedev',
          tech: '3D Audio, Unity',
          status: 'In Dev',
          description: '3D echolocation horror experience',
          link: null
        },
        {
          name: 'WhiteFox Design',
          type: 'Portfolio',
          category: 'design',
          tech: 'HTML, CSS, JS',
          status: 'Live',
          description: 'Professional logo design services',
          link: 'https://whitefoxdesigns.net'
        }
      ];

      const result = [
        '╭─────────────────────────────────────────────────────────────────────────╮',
        '│                               PROJECTS                                  │',
        '╰─────────────────────────────────────────────────────────────────────────╯',
        '',
        '📂 Categories: fullstack | backend | gamedev | design',
        '🔍 Filter: projects <category> (e.g., "projects gamedev")',
        '',
        '┌─────────────────┬──────────────┬─────────┬──────────────────────────┐',
        '│ Project         │ Type         │ Status  │ Description              │',
        '├─────────────────┼──────────────┼─────────┼──────────────────────────┤'
      ];

      projects.forEach(project => {
        const name = project.name.length > 15 ? project.name.substring(0, 12) + '...' : project.name.padEnd(15);
        const type = project.type.length > 12 ? project.type.substring(0, 9) + '...' : project.type.padEnd(12);
        const status = project.status.padEnd(7);
        const desc = project.description.length > 24 ?
          project.description.substring(0, 21) + '...' :
          project.description.padEnd(24);

        result.push(`│ ${name} │ ${type} │ ${status} │ ${desc} │`);
      });

      result.push('└─────────────────┴──────────────┴─────────┴──────────────────────────┘');
      result.push('');
      result.push('🔗 Links:');

      projects.forEach(project => {
        if (project.link) {
          result.push(`   ${project.name}: LINK:${project.link}`);
        }
      });

      result.push('');
      result.push('💡 Use "projects <category>" to filter by category');
      result.push('');
      return result;
    },

    contact: () => [
      'GET IN TOUCH',
      '',
      '📧 Email:',
      '   LINK:mailto:kris@rabbittale.co:kris@rabbittale.co',
      '   └─ Business inquiries & collaborations',
      '',
      '💬 Social & Chat:',
      '   🔷 Telegram: LINK:https://t.me/hasiradoo:@hasiradoo',
      '   🎮 Discord: LINK:https://discord.com/users/569975072417251378:@hasiradoo',
      '   🐦 Twitter: LINK:https://twitter.com/hasiradoo:@hasiradoo',
      '   🦋 Bluesky: LINK:https://bsky.app/profile/hasiradoo.rabbittale.co:@hasiradoo.rabbittale.co',
      '',
      '💼 Professional:',
      '   🐙 GitHub: LINK:https://github.com/rabbit-tale-co:github.com/rabbit-tale-co',
      '',
      '📍 Location: Poland 🇵🇱',
      '⏰ Timezone: CET (UTC+1)',
      '',
      '✨ Open for:',
      '  • UI/UX Design projects',
      '  • Frontend development work',
      '  • Design system consulting',
      '  • Figma workshops & training',
      '',
      '🤝 Let\'s create something amazing!',
      ''
    ],

    social: () => [
      'SOCIAL LINKS',
      '',
      '🔗 Find me across the web:',
      '',
      '  📱 Chat & Messaging:',
      '     🔷 Telegram    LINK:https://t.me/hasiradoo:@hasiradoo',
      '     🎮 Discord     LINK:https://discord.com/users/569975072417251378:@hasiradoo',
      '     📧 Email       LINK:mailto:kris@rabbittale.co:kris@rabbittale.co',
      '',
      '  🌐 Social Media:',
      '     🐦 Twitter     LINK:https://twitter.com/hasiradoo:@hasiradoo',
      '     🦋 Bluesky     LINK:https://bsky.app/profile/hasiradoo.rabbittale.co:@hasiradoo.rabbittale.co',
      '',
      '  💼 Professional:',
      '     🐙 GitHub      LINK:https://github.com/rabbit-tale-co:github.com/rabbit-tale-co',
      '',
      '💬 Preferred: Telegram or Email',
      '🚀 Follow for design tips & updates!',
      ''
    ],

    help: () => [
      '',
      '╭─────────────────────────────────────────────────╮',
      '│                AVAILABLE COMMANDS               │',
      '╰─────────────────────────────────────────────────╯',
      '',
      '🏠 Navigation:',
      '  home              return to main page',
      '  about             learn more about Kris',
      '  skills            technical skills & expertise',
      '  projects          featured work & projects',
      '  contact           get in touch',
      '  social            social media links',
      '  back              go back to previous page',
      '  cd ..             go back to parent directory',
      '',
      '🛠️ System:',
      '  help              show this help menu',
      '  clear             clear the terminal',
      '  neofetch          system info with ASCII art',
      '  whoami            current user information',
      '  pwd               show current path',
      '',
      '🎨 Fun:',
      '  banner            display welcome banner',
      '  quote             random design quote',
      '  easteregg         find the hidden surprise',
      '',
      '💡 Tips:',
      '  • Use ↑↓ arrows for command history',
      '  • Commands auto-route to new sections',
      '  • Type any command to get started!',
      ''
    ],

    neofetch: () => {
      const asciiArt = [
        ',KWN0d;.             :kx;.',
        ':XMMMMWO;           lNMMNd.',
        ':XMMMMMMX:         cXMMMMNl',
        ':XMMMMMMMO.       :XMMMMMMk.',
        ':XMMMMMMMK,      :KMMMMMMWo',
        ':XMMMMMMMK,     ;KMMMMMMWk.',
        ':XMMMMMMMO.    ,0MMMMMMNx.',
        ':XMMMMMMWd.  ,o0MMMMMMXl.',
        ':XMMMMMMX;  \'OWWMMMMWk,',
        ':XMMMMMMXc.;OWMMMMMNo.',
        ':XMMMMMMMNXNMMMMMMMWOc.',
        ':XMMMMMMMMMMMMMMMMMMMMXx,',
        ':XMMMMMMMMMWWWMMMMMMMMMMXo.',
        ':XMMMMMWKxc;,;:cxKWMMMMMMNo',
        ':XMMMMNx.        .xWMMMMMMK,',
        ':XMMMMXc.        .cXMMMMMMX;',
        ':XMMMMMN0OOOOO0OO0NMMMMMMMO.',
        '\'OMMMMMMMMMMMMMMMMMMMMMMW0;',
        ',ONMMMMMMMMMMMMMMMMMMWKo.',
        '.l0WMMMMMMMMMMMMMWN0o.'
      ];

      const systemInfo = [
        'Kris@workstation (WIP)',
        '─────────────────',
        'OS: Windows 11 Pro',
        'Host: Custom Build',
        'Kernel: NT 10.0.22631',
        'Uptime: Over 9000 hours',
        'Packages: Too many to count',
        'Shell: PowerShell 7.x',
        'Resolution: 1920x1080@60Hz',
        'DE: Windows 11',
        'WM: DWM',
        'Terminal: Windows Terminal',
        'CPU: Intel i7-17700',
        'GPU: NVIDIA GTX 1080 6GB',
        'Memory: 16GB (don\'t remember speed)',
        'Storage: 256GB NVMe SSD',
        'Storage: 4TB HDD',
        'Motherboard: ASRock B250 pro4',
        'PSU: 500W 80+ Gold',
      ];

      const result = [''];
      const maxLines = Math.max(asciiArt.length, systemInfo.length);

      for (let i = 0; i < maxLines; i++) {
        const leftSide = asciiArt[i] || '';
        const rightSide = systemInfo[i] || '';
        const padding = ' '.repeat(Math.max(0, 36 - leftSide.length));
        result.push(leftSide + padding + rightSide);
      }

      result.push('');
      return result;
    },

    banner: () => [
      '',
      '    ,KWN0d;.             :kx;.',
      ':XMMMMWO;           lNMMNd.',
      ':XMMMMMMX:         cXMMMMNl',
      ':XMMMMMMMO.       :XMMMMMMk.',
      ':XMMMMMMMK,      :KMMMMMMWo',
      ':XMMMMMMMK,     ;KMMMMMMWk.',
      ':XMMMMMMMO.    ,0MMMMMMNx.',
      ':XMMMMMMWd.  ,o0MMMMMMXl.',
      ':XMMMMMMX;  \'OWWMMMMWk,',
      ':XMMMMMMXc.;OWMMMMMNo.',
      ':XMMMMMMMNXNMMMMMMMWOc.',
      ':XMMMMMMMMMMMMMMMMMMMMXx,',
      ':XMMMMMMMMMWWWMMMMMMMMMMXo.',
      ':XMMMMMWKxc;,;:cxKWMMMMMMNo',
      ':XMMMMNx.        .xWMMMMMMK,',
      ':XMMMMXc.        .cXMMMMMMX;',
      ':XMMMMMN0OOOOO0OO0NMMMMMMMO.',
      '\'OMMMMMMMMMMMMMMMMMMMMMMW0;',
      ',ONMMMMMMMMMMMMMMMMMMWKo.',
      '.l0WMMMMMMMMMMMMMWN0o.',
      '',
      '════════════════════════════════════════════════════════════════════════',
      '                    🎨 KRIS GERMAN - UI/UX DESIGNER 🎨                 ',
      '                                                                        ',
      '         🚀 Welcome to my interactive portfolio terminal! 🌟           ',
      '                   💡 Type "help" to get started 🎮                    ',
      '════════════════════════════════════════════════════════════════════════',
      ''
    ],

    quote: () => {
      const quotes = [
        '"Good design is obvious. Great design is transparent." - Joe Sparano',
        '"Design is not just what it looks like. Design is how it works." - Steve Jobs',
        '"The best interface is no interface." - Golden Krishna',
        '"Simplicity is the ultimate sophistication." - Leonardo da Vinci',
        '"Design is thinking made visual." - Saul Bass',
        '"User experience is everything. It always has been, but it\'s undervalued." - Evan Williams',
        '"If you think good design is expensive, you should look at bad design." - Ralf Speth'
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      return [
        '',
        '╭─────────────────────────────────────────────────╮',
        '│                DESIGN INSPIRATION               │',
        '╰─────────────────────────────────────────────────╯',
        '',
        `💭 ${randomQuote}`,
        ''
      ];
    },

    easteregg: () => [
      '',
      '🎉 Congratulations! You found the easter egg!',
      '',
      '🥚 Here\'s a secret about Kris:',
      '   Despite being a UI/UX expert, he still struggles',
      '   with centering divs sometimes! 😅',
      '',
      '🚀 Thanks for exploring! You\'re awesome! ✨',
      ''
    ],

    clear: () => {
      setHistory([]);
      setCurrentRoute(null);
      return null;
    },

    back: () => {
      if (navigationHistory.length > 0) {
        const previousPage = navigationHistory[navigationHistory.length - 1];
        setNavigationHistory(prev => prev.slice(0, -1));
        router.push(previousPage === 'home' ? '/' : `/${previousPage}`);
      } else {
        router.push('/');
      }
      return null;
    },

    'cd ..': () => {
      router.push('/');
      return null;
    },

    whoami: () => [`${username}@${hostname}`, `Kris German's Interactive Portfolio Terminal`],
    pwd: () => [currentPath, 'Current location in the portfolio']
  }), [calculateAge, calculateSkillLevel, generateProgressBar, getFilteredProjects, username, hostname, currentPath]);

  // Save command to history (cache)
  const saveToCommandHistory = (command: string) => {
    if (command.trim() === '') return;

    const newHistory = [...commandHistory];
    // Remove if already exists to avoid duplicates
    const existingIndex = newHistory.indexOf(command);
    if (existingIndex > -1) {
      newHistory.splice(existingIndex, 1);
    }
    // Add to beginning
    newHistory.unshift(command);
    // Keep only last 50 commands
    if (newHistory.length > 50) {
      newHistory.pop();
    }

    setCommandHistory(newHistory);
    setHistoryIndex(-1);

    // Save to localStorage
    localStorage.setItem('portfolio-history', JSON.stringify(newHistory));
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load command history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('portfolio-history');
    if (saved) {
      try {
        setCommandHistory(JSON.parse(saved));
      } catch {
        console.log('Failed to load command history');
      }
    }
  }, []);

  const handleCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    if (!command) return;

    // Handle projects filtering
    if (command.startsWith('projects ')) {
      const category = command.split(' ')[1];
      const filteredProjects = getFilteredProjects(category);

      const newHistory: TerminalLine[] = [{
        type: 'command',
        content: cmd,
        timestamp: new Date().toLocaleTimeString(),
        id: `cmd-${Date.now()}`
      }];

      setIsTyping(true);

      setTimeout(() => {
        if (!isMountedRef.current) return;

        const outputLines = filteredProjects.map((line: string, index: number) => ({
          type: 'output' as const,
          content: line,
          timestamp: new Date().toLocaleTimeString(),
          id: `output-${Date.now()}-${index}`
        }));
        setHistory([...newHistory, ...outputLines]);
        setIsTyping(false);

        // Restore focus after command execution
        setTimeout(() => {
          if (isMountedRef.current && inputRef.current) {
            inputRef.current.focus();
          }
        }, 50);
      }, 300);

      setInput('');
      return;
    }

    // Save command to history
    saveToCommandHistory(command);

    // Handle clear command specially - don't add to display history
    if (command === 'clear') {
      setHistory([]);
      setCurrentRoute(null);
      setInput('');
      return;
    }

    // Add command to display
    const newHistory: TerminalLine[] = [{
      type: 'command',
      content: cmd,
      timestamp: new Date().toLocaleTimeString(),
      id: `cmd-${Date.now()}`
    }];

    setIsTyping(true);

    // Handle navigation commands
    if (['about', 'skills', 'projects', 'contact', 'social'].includes(command)) {
      // Save current page to navigation history before navigating
      if (currentRoute) {
        setNavigationHistory(prev => [...prev, currentRoute]);
      } else {
        setNavigationHistory(prev => [...prev, 'home']);
      }

      router.push(`/${command}`);

      // Ensure focus is maintained after navigation
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

      return;
    }

    // Handle home command specially
    if (command === 'home') {
      if (currentRoute) {
        setNavigationHistory(prev => [...prev, currentRoute]);
        router.push('/');

        // Ensure focus is maintained after navigation
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);

        return;
      }
      // If already on home page, show home content locally
    }

    // Handle back navigation commands
    if (command === 'back' || command === 'cd ..') {
      routes[command as keyof typeof routes]();
      return;
    }

    // Handle other commands locally
    if (routes[command as keyof typeof routes]) {
      setCurrentRoute(command === 'home' ? null : command);

      setTimeout(() => {
        if (!isMountedRef.current) return;

        const output = routes[command as keyof typeof routes]();
        if (output) {
          const outputLines = output.map((line, index) => ({
            type: 'output' as const,
            content: line,
            timestamp: new Date().toLocaleTimeString(),
            id: `output-${Date.now()}-${index}`
          }));
          setHistory([...newHistory, ...outputLines]);
        } else {
          setHistory(newHistory);
        }
        setIsTyping(false);

        // Restore focus after command execution
        setTimeout(() => {
          if (isMountedRef.current && inputRef.current) {
            inputRef.current.focus();
          }
        }, 50);
      }, 300);
    } else {
      // Unknown command
      setTimeout(() => {
        if (!isMountedRef.current) return;

        setHistory([
          ...newHistory,
          {
            type: 'error',
            content: `Command not found: ${command}\nType 'help' for available commands.`,
            timestamp: new Date().toLocaleTimeString(),
            id: `error-${Date.now()}`
          }
        ]);
        setIsTyping(false);

        // Restore focus after error
        setTimeout(() => {
          if (isMountedRef.current && inputRef.current) {
            inputRef.current.focus();
          }
        }, 50);
      }, 300);
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && selectedSuggestion >= 0) {
        // Use selected suggestion
        setInput(suggestions[selectedSuggestion].cmd);
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      } else {
        handleCommand(input);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        const indexToUse = selectedSuggestion >= 0 ? selectedSuggestion : 0;
        setInput(suggestions[indexToUse].cmd);
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    } else if (e.key === 'ArrowUp') {
      if (showSuggestions) {
        e.preventDefault();
        setSelectedSuggestion(prev =>
          prev <= 0 ? suggestions.length - 1 : prev - 1
        );
      } else {
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex] || '');
        }
      }
    } else if (e.key === 'ArrowDown') {
      if (showSuggestions) {
        e.preventDefault();
        setSelectedSuggestion(prev =>
          prev >= suggestions.length - 1 ? 0 : prev + 1
        );
      } else {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInput('');
        }
      }
    }
    // Let other keys (like Backspace, Delete, letters, etc.) work normally
    // Don't preventDefault for them so they can edit the input
  };

  const getPrompt = () => {
    const route = currentRoute ? `[${currentRoute}]` : '';
    return (
      <span>
        <span className="text-lime">{username}</span>
        <span className="text-accent">@</span>
        <span className="text-cyan">{hostname}</span>
        <span className="text-accent">:</span>
        <span className="text-yellow">{currentPath}</span>
        <span className="text-purple">{route}</span>
        <span className="text-orange">$ </span>
      </span>
    );
  };

  // Auto-focus and show content based on route
  useEffect(() => {
    // Always focus input when component mounts or route changes
    const focusInput = () => {
      if (isMountedRef.current && inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus immediately
    focusInput();

    // Also focus after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        focusInput();
      }
    }, 100);

    // Show content based on route
    if (isMountedRef.current) {
      if (initialRoute && routes[initialRoute as keyof typeof routes]) {
        const output = routes[initialRoute as keyof typeof routes]();
        const contentHistory = output?.map((line, index) => ({
          type: 'output' as const,
          content: line,
          timestamp: new Date().toLocaleTimeString(),
          id: `content-${initialRoute}-${index}`
        }));
        if (isMountedRef.current) {
          setHistory(contentHistory || []);
        }
      } else {
        // Show welcome banner on home page
        const welcomeOutput = routes.home();
        const welcomeHistory = welcomeOutput.map((line, index) => ({
          type: 'output' as const,
          content: line,
          timestamp: new Date().toLocaleTimeString(),
          id: `welcome-${index}`
        }));
        if (isMountedRef.current) {
          setHistory(welcomeHistory);
        }
      }
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initialRoute]);

  // Additional focus effect for route changes
  useEffect(() => {
    const focusInput = () => {
      if (isMountedRef.current && inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus when currentRoute changes
    focusInput();
  }, [currentRoute]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = terminalRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [history, isTyping]);

  // Mobile keyboard handling
  useEffect(() => {
    const handleResize = () => {
      if (isMountedRef.current && inputRef.current) {
        setTimeout(() => {
          if (isMountedRef.current && inputRef.current) {
            inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Global focus handler
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Don't focus input if clicking on a link or other interactive element
      if (e.target instanceof HTMLAnchorElement ||
        e.target instanceof HTMLButtonElement ||
        (e.target as HTMLElement)?.closest('a')) {
        return;
      }

      if (isMountedRef.current && inputRef.current && !isTyping) {
        inputRef.current.focus();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input on any key press (except when already focused or typing)
      if (isMountedRef.current && document.activeElement !== inputRef.current && inputRef.current && !isTyping) {
        // Don't interfere with other input elements
        if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTyping]);

  // Ensure focus after any state change
  useEffect(() => {
    if (!isTyping && inputRef.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current && inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isTyping, history]);

  return (
    <div className="fixed inset-0 font-mono overflow-hidden flex items-center justify-center md:p-4" style={{
      background: 'linear-gradient(135deg, var(--terminal-bg) 0%, var(--terminal-bg-secondary) 100%)',
      color: 'var(--terminal-green)'
    }}>
      <div className="w-full max-w-6xl h-full md:max-h-[90vh] md:h-auto flex flex-col md:rounded-lg shadow-2xl terminal-container">
        {/* Terminal Header - Hidden on mobile */}
        <div className="terminal-header hidden md:flex" suppressHydrationWarning>
          <div className="terminal-buttons">
            <div className="terminal-button close"></div>
            <div className="terminal-button minimize"></div>
            <div className="terminal-button maximize"></div>
          </div>
          <div className="terminal-title">Kris German - Portfolio Terminal</div>
          <div className="w-16"></div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-[var(--terminal-bg)] border-b border-gray-700 p-3 flex items-center justify-between" suppressHydrationWarning>
          <div className="text-cyan font-bold text-lg">Kris German</div>
          <div className="text-xs text-gray-400">Portfolio Terminal</div>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          className="terminal-content flex-1 overflow-auto"
          style={{
            minHeight: 0,
            height: '100%'
          }}
          onClick={(e) => {
            // Don't focus input if clicking on a link
            if (e.target instanceof HTMLAnchorElement ||
              (e.target as HTMLElement)?.closest('a')) {
              return;
            }
            inputRef.current?.focus();
          }}
        >
          {/* History */}
          <div className="terminal-history">
            {history.map((line) => (
              <div key={line.id} className="block mb-1">
                {line.type === 'command' && (
                  <div className="text-prompt font-bold mb-1">
                    <span className="text-cyan">$</span> <span className="text-yellow">{line.content}</span>
                  </div>
                )}
                {line.type === 'output' && (
                  line.content.startsWith('IMAGEGRID:') ? (
                    <div className='flex justify-center flex-wrap gap-4 mt-4 p-4'>
                      {line.content.substring(10).split('|').map((imageData, index) => {
                        const [src, alt] = imageData.split(':');
                        return (
                          <div key={index} className="text-center">
                            <Image
                              src={src}
                              alt={alt}
                              width={180}
                              height={110}
                              className="object-cover rounded-lg shadow-lg hover:scale-105 transition-transform duration-200"
                              style={{
                                border: '2px solid var(--terminal-green)',
                                backgroundColor: 'var(--terminal-bg)'
                              }}
                            />
                            <div className="mt-2 text-xs text-prompt font-bold text-center">
                              {alt}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : line.content.startsWith('IMAGE:') ? (
                    <div className="text-center my-4">
                      <Image
                        src={line.content.split(':')[1]}
                        alt={line.content.split(':')[2]}
                        width={200}
                        height={120}
                        className="object-cover rounded-lg shadow-lg hover:scale-105 transition-transform duration-200"
                        style={{
                          border: '1px solid var(--terminal-green)',
                          backgroundColor: 'var(--terminal-bg)'
                        }}
                      />
                    </div>

                  ) : (
                    <pre className="terminal-ascii whitespace-pre-wrap font-mono leading-relaxed m-0 p-0 text-sm md:text-xs">
                      {parseTextWithLinks(line.content)}
                    </pre>
                  )
                )}
                {line.type === 'error' && (
                  <div className="text-error whitespace-pre font-mono">{line.content}</div>
                )}
                {line.type === 'system' && (
                  <div className="text-accent whitespace-pre font-mono leading-relaxed">{line.content}</div>
                )}
              </div>
            ))}
          </div>

          {/* Current Command Line */}
          <div className="terminal-command-line relative flex-shrink-0 bg-[var(--terminal-bg)] border-t border-gray-700 md:border-t-0">
            {/* Desktop prompt */}
            <span className="font-bold hidden md:inline">{getPrompt()}</span>

            {/* Mobile layout */}
            <div className="md:hidden p-3 border-b border-gray-600">
              <div className="text-xs text-gray-400 mb-2">{currentPath}</div>
            </div>

            <div className="relative p-3 md:p-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="command-input w-full p-3 md:p-1 text-base md:text-sm bg-transparent border border-gray-600 md:border-none rounded-lg md:rounded-none focus:outline-none focus:border-cyan-500 md:focus:border-transparent"
                placeholder="Type a command... (try 'help')"
                spellCheck={false}
                autoComplete="off"
                disabled={isTyping}
              />

              {/* Desktop Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-[400px] max-h-48 bg-gray-900 border border-gray-600 rounded-md shadow-lg z-50 overflow-y-auto hidden md:block"
                  style={{
                    backgroundColor: 'var(--terminal-bg)',
                    borderColor: 'var(--terminal-green)',
                    color: 'var(--terminal-green)'
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.cmd}
                      className={`px-3 py-2 cursor-pointer font-mono hover:bg-gray-800 ${index === selectedSuggestion ? 'bg-gray-700 text-cyan-300' : 'text-green-300'
                        }`}
                      style={{
                        backgroundColor: index === selectedSuggestion ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                      }}
                      onClick={() => {
                        setInput(suggestion.cmd);
                        setShowSuggestions(false);
                        setSelectedSuggestion(-1);
                        inputRef.current?.focus();
                      }}
                    >
                      <div className="flex flex-col">
                        <div>
                          <span className="text-cyan-300">$</span> {suggestion.cmd}
                        </div>
                        <div className="text-xs text-gray-400 ml-2">
                          {suggestion.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile Bottom Sheet Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-[var(--terminal-bg)] border-t border-gray-600 max-h-64 overflow-y-auto" suppressHydrationWarning>
                  <div className="p-2">
                    <div className="text-xs text-gray-400 mb-2 px-2">Suggestions:</div>
                    <div className="flex flex-col gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.cmd}
                          className={`w-full text-left p-3 rounded-lg font-mono transition-colors ${index === selectedSuggestion
                            ? 'bg-gray-700 text-cyan-300 border border-cyan-500'
                            : 'bg-gray-800 text-green-300 border border-gray-600 hover:bg-gray-700'
                            }`}
                          onClick={() => {
                            setInput(suggestion.cmd);
                            setShowSuggestions(false);
                            setSelectedSuggestion(-1);
                            inputRef.current?.focus();
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold">
                                <span className="text-cyan-300">$</span> {suggestion.cmd}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {suggestion.desc}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">tap</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
