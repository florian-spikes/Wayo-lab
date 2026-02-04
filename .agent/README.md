# Compétences Antigravity configurées

## UI/UX Pro Max

**Skill installé :** ✅ `ui-ux-pro-max`

### Description
Intelligence de design UI/UX pour construire des interfaces professionnelles. Cette compétence fournit :
- **67 styles UI** (Glassmorphism, Claymorphism, Minimalism, etc.)
- **96 palettes de couleurs** spécifiques par industrie
- **57 combinaisons de polices** avec imports Google Fonts
- **25 types de graphiques** pour dashboards et analytics
- **13 stacks techniques** (React, Next.js, Vue, HTML+Tailwind, etc.)
- **100 règles de raisonnement** pour génération de design system
- **99 guidelines UX** et anti-patterns

### Activation
Cette skill s'active automatiquement quand vous demandez du travail UI/UX (design, build, create, implement, review, fix, improve).

### Exemples d'utilisation

```
Construis une landing page pour mon produit SaaS de voyage

Crée un dashboard pour analytics de santé

Design un site portfolio avec dark mode

Améliore le design de cette page avec un look plus moderne
```

### Workflow de base

1. **Analyse des besoins** : Type de produit, style, industrie, stack technique
2. **Génération du design system** : Pattern, style, couleurs, typographie
3. **Recherches détaillées** : Compléments sur style, UX, charts si nécessaire
4. **Guidelines stack** : Best practices spécifiques au framework
5. **Implémentation** : Code avec les bonnes pratiques

### Commandes directes (avancé)

```bash
# Générer un design system complet
python .agent/skills/ui-ux-pro-max/scripts/search.py "travel planning SaaS" --design-system -p "Wayo"

# Recherche par domaine
python .agent/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style

# Guidelines par stack
python .agent/skills/ui-ux-pro-max/scripts/search.py "responsive layout" --stack html-tailwind
```

---

## Prochaines étapes

Pour ajouter d'autres skills, clonez les repositories dans `.agent/skills/` :

```bash
cd .agent/skills
git clone <url-du-skill>
```

Assurez-vous que chaque skill contient un fichier `SKILL.md` avec le frontmatter approprié.
