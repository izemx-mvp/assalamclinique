# CLINIQUE ASSALAM ERP

Agis en tant qu'Ingénieur Full-Stack Senior et Designer UX/UI spécialisé dans les applications SaaS pour le secteur de la santé.

Je souhaite perfectionner le MVP du module ERP médical avec un design Glassmorphism Bleu Navy complet. Le projet comporte une structure de navigation hiérarchique avec un module principal "Interventions" divisé en 2 sous-modules synchronisés :

1. Sous-module 1 (prioritaire) : **Paramétrage des Interventions** (icône sliders / engrenage) pour la configuration des matrices de pièces et de l'ordre strict.

2. Sous-module 2 : **Dossiers d'Intervention** (icône stéthoscope / dossier médical) pour l'audit IA, le traitement des pièces, la checklist dynamique et la compilation PDF.

---

### ⚠️ EXIGENCE DE FONCTIONNALITÉ INTERACTIVE (IMPORTANT)

Tous les boutons, formulaires, sélecteurs, actions de glisser-déposer, réordonnancements, suppressions, modales et bascules (toggles) doivent être 100% fonctionnels avec un état global synchronisé (React / Zustand / Tailwind / Shadcn UI).

---

### 🎨 DESIGN SYSTEM & STYLE (BLEU NAVY & GLASSMORPHISME)

- **Palette de couleurs :** Thème sombre Bleu Navy profond (`#050b18`, `#0a1735`, `#0f2347`, accents bleus luminescents `#3b82f6` et `#60a5fa`, rouge vif `#ef4444` pour les erreurs/suppressions, émeraude `#10b981` pour la validation).

- **Style Visuel :** Glassmorphic UI (Panneaux en verre dépoli avec `backdrop-filter: blur(16px)`, bordures translucides fines `border-white/10`, reflets lumineux et ombres portées douces).

- **Structure Monopage (SANS Fil d'Ariane / Stepper) :** Interface divisée en panneaux clairs et aérés.

- **Alignement des Boutons :** Tous les groupes d'actions doivent être parfaitement centrés et alignés (`flex justify-center items-center gap-3`).

---

### 📌 NAVIGATION & SIDEBAR (MODULE UNIQUE "INTERVENTIONS")

Sidebar collapsible à gauche avec :

- Logo & Titre ERP ("MedFlow ERP").

- Menu principal déroulant/accordéon **"Interventions"** contenant exactement 2 sous-modules dans cet ordre :

  1. **Paramétrage des Interventions** (icône sliders / engrenage) — *Placé en 1ère position*.

  2. **Dossiers d'Intervention** (icône stéthoscope / dossier médical) — *Placé en 2ème position*.

---

### ⚙️ SOUS-MODULE 1 : PARAMÉTRAGE DES INTERVENTIONS (ADMIN / MÉTIER)

Mettre à jour l'interface de paramétrage avec les ajustements suivants :

1. **Suppression de Section :**

   - **Supprimer complètement le panneau "Règles de contrôle par document"** (checkboxes de signature/cachet, validité, etc.).

   - Utiliser l'espace libéré pour agrandir harmonieusement le panneau "Ordre strict".

2. **Panneau "Profils d'intervention" (Colonne Gauche - Haut) :**

   - Liste des profils : Cholécystite, Césarienne, Cataracte, PTH, Accouchement voie basse, Amygdalectomie, Coronarographie, Appendicectomie, etc.

   - Boutons d'action sur chaque ligne : Dupliquer et Supprimer (icône corbeille rouge).

   - Bouton d'ajout : `+ Nouveau profil d'intervention`.

3. **Panneau "Référentiel des pièces" (Colonne Gauche - Bas) :**

   - Sélecteur d'Organisme (CNSS, CNOPS, FAR, CMIM, BP, BAM, MGBM, ASSUR Étrangère) et Commutateur Mode (PEC / Expédition).

   - Liste des pièces avec switch On/Off (valeur `1` ou `0`).

   - **Bouton Supprimer sur chaque pièce :** Ajouter une icône/bouton corbeille pour supprimer définitivement un document de la liste si non pertinent.

   - Bouton `+ Ajouter un document type` (sélection depuis catalogue ou création personnalisée).

4. **Panneau "Ordre strict" (Colonne Droite) :**

   - Affiche les pièces actives (`1`) pour le profil, l'organisme et le mode sélectionnés.

   - Flèches haut/bas et Drag & Drop fonctionnels pour réorganiser l'ordre exact des pages.

   - Bouton de suppression individuelle (icône poubelle).

   - **Bouton Enregistrer :** Ajouter un bouton clair et centré **`[Enregistrer l'ordre des pièces]`** en bas du panneau pour confirmer et sauvegarder les modifications.

   - **Synchronisation immédiate :** Dès que l'ordre est enregistré, il met à jour la checklist et l'ordre attendu dans le sous-module "Dossiers d'Intervention".

---

### 🩺 SOUS-MODULE 2 : DOSSIERS D'INTERVENTION (CONTRÔLE & EXPORT)

#### 1. Header Compact et Épuré

- **Ligne 1 :** Titre ("Dossiers Interventions / ERP Clinique - Audit IA"), Commutateur Mode (PEC / Expédition), Menu déroulant moderne d'Intervention (alimenté par le paramétrage), Barre de recherche unifiée et Sélecteur Patient (`CLINI-001 — Ouassim BEN MASSAOUD`).

- **Ligne 2 :** Données patient sobres en petite taille :

  `Patient : Ouassim BEN MASSAOUD | CIN Patient : S774138 | CIN Assuré : S774138 | Assuré : Ouassim BEN MASSAOUD (lui-même) | Organisme : CNSS`

#### 2. Colonne Gauche : Checklist Dynamique & Numérisation

- **Checklist Dynamique :** N'affiche que les pièces actives définies dans le Paramétrage pour le triplet (Intervention × Mode × Organisme).

  - La ligne "CIN patient / Passeport" passe au vert dès que **Recto ET Verso** sont importés.

  - La ligne "CIN assuré" est validée automatiquement (Patient = Assuré).

- **Zone de Dépôt des Scans :** Glisser-déposer fonctionnel avec boutons centrés `[Importer des fichiers]` et `[IA : ranger & redresser]`.

- **Ordre du dossier :** Liste dynamique affichant les scans réels téléversés avec nom détecté, badge d'angle et bouton supprimer.

#### 3. Colonne Droite : Visualiseur Réel, Journal d'Audit & Export

- **Aperçu Document :** Rendu réel du fichier sélectionné (image/PDF) avec bouton **"Remplacer la pièce"** en bas à droite (sans boutons redresser/pivoter manuels).

- **Action "Lancer le contrôle IA" :** Déclenche l'audit OCR.

- **Journal d'Audit IA (Smart Mock) :**

  - Si document manquant (ex: Carte Mutuelle) : valide uniquement si le nom de fichier contient `carte`, `mut` ou `mutuelle`. Sinon, maintient l'alerte **"Document manquant : Carte mutuelle / Droit d'assuré"** avec le bouton `[Ajouter la pièce]`.

  - Si anomalie (nom contenant `anom` ou `anomalie`) : affiche l'alerte détaillée avec le bouton `[Remplacer la pièce]`.

  - Re-contrôle : Clic sur `[Lancer le contrôle IA]` après remplacement pour recalculer l'état.

- **Génération & Transmission (Boutons Centrés) :**

  - Bouton `[Générer le dossier]` : Compile les pages dans l'ordre strict avec nommage `PEC_CNSS_Ouassim-BEN-MASSAOUD_CLINI-01.pdf`.

  - Bouton `[Télécharger le dossier (PDF)]` : Grisé et désactivé tant qu'au moins 1 anomalie subsiste ; actif dès 100% de conformité.

  - Bouton Dynamique : `[Transmettre à la PEC]` ou `[Valider et Transmettre à l'Expédition]` (verrouillé si anomalies).

---

### 📋 MATRICE DÉTAILLÉE DES EXIGENCES : INTERVENTION CHOLÉCYSTITE

#### 🔹 1. CNSS

- **Mode PEC (Ordre strict = 1) :** 1. Demande de PEC, 2. Note confidentielle, 3. Compte rendu radiologique (IRM - Scanner - Echographie), 4. Cin patient /Passeport, 5. Carte mutuelle /Droit d'assuré (portail), 6. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Cin patient /Passeport, 2. Carte mutuelle /Droit d'assuré (portail), 3. Cin assuré /Passeport, 4. Feuille RAS, 5. Accord de prise en charge, 6. Facture forfaitaire, 7. Compte rendu opératoire, 8. Résultat anapath

#### 🔹 2. CNOPS

- **Mode PEC (Ordre strict = 1) :** 1. Demande de PEC, 2. Note confidentielle, 3. Compte rendu radiologique, 4. Cin patient /Passeport, 5. Carte mutuelle /Droit d'assuré, 6. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Feuille de soins signé par assuré, 2. Cin patient /Passeport, 3. Carte mutuelle /Droit d'assuré, 4. Cin assuré /Passeport, 5. Accord de prise en charge, 6. Facture forfaitaire avec RAS, 7. Compte rendu opératoire, 8. Résultat anapath

#### 🔹 3. FAR

- **Mode PEC (Ordre strict = 1) :** 1. Demande de PEC, 2. Note confidentielle, 3. Compte rendu radiologique, 4. Cin patient /Passeport, 5. Carte mutuelle /Droit d'assuré, 6. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Cin patient /Passeport, 2. Carte mutuelle /Droit d'assuré, 3. Cin assuré /Passeport, 4. Accord de prise en charge, 5. Facture forfaitaire avec RAS, 6. Compte rendu opératoire, 7. Résultat anapath

#### 🔹 4. CMIM

- **Mode PEC (Ordre strict = 1) :** 1. Devis, 2. Note confidentielle, 3. Compte rendu radiologique, 4. Cin patient /Passeport, 5. Carte mutuelle /Droit d'assuré, 6. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Cin patient /Passeport, 2. Carte mutuelle /Droit d'assuré, 3. Cin assuré /Passeport, 4. Accord de prise en charge, 5. Facture détaillée, 6. Détail pharmacie, 7. Notes des honoraires médecins, 8. Compte rendu opératoire, 9. Résultat anapath

#### 🔹 5. BANQUE POPULAIRE

- **Mode PEC (Ordre strict = 1) :** 1. Engagement de paiement, 2. Note confidentielle, 3. Compte rendu radiologique, 4. Cin patient /Passeport, 5. Carte mutuelle /Droit d'assuré, 6. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Feuille de soins signé par assuré, 2. Engagement de paiement, 3. Cin patient /Passeport, 4. Carte mutuelle /Droit d'assuré, 5. Cin assuré /Passeport, 6. Accord de prise en charge, 7. Facture détaillée, 8. Détail pharmacie, 9. Notes des honoraires médecins, 10. Compte rendu opératoire, 11. Résultat anapath

#### 🔹 6. BANK AL MAGHREB (BAM)

- **Mode PEC (Ordre strict = 1) :** 1. Devis, 2. Note confidentielle, 3. Compte rendu radiologique, 4. Cin patient /Passeport, 5. Carte mutuelle /Droit d'assuré, 6. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Cin patient /Passeport, 2. Carte mutuelle /Droit d'assuré, 3. Cin assuré /Passeport, 4. Accord de prise en charge, 5. Facture détaillée, 6. Détail pharmacie, 7. Notes des honoraires médecins, 8. Compte rendu opératoire, 9. Résultat anapath

#### 🔹 7. MGBM

- **Mode PEC (Ordre strict = 1) :** 1. Note confidentielle, 2. Compte rendu radiologique, 3. Cin patient /Passeport, 4. Carte mutuelle /Droit d'assuré, 5. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Devis, 2. Cin patient /Passeport, 3. Carte mutuelle /Droit d'assuré, 4. Cin assuré /Passeport, 5. Accord de prise en charge, 6. Facture détaillée, 7. Détail pharmacie, 8. Notes des honoraires médecins, 9. Compte rendu opératoire, 10. Résultat anapath

#### 🔹 8. ASSURANCE ÉTRANGÈRE

- **Mode PEC (Ordre strict = 1) :** 1. Devis, 2. Note confidentielle, 3. Compte rendu radiologique, 4. Cin patient /Passeport, 5. Carte mutuelle /Droit d'assuré, 6. Cin assuré /Passeport

- **Mode Expédition (Ordre strict = 1) :** 1. Cin patient /Passeport, 2. Carte mutuelle /Droit d'assuré, 3. Cin assuré /Passeport, 4. Accord de prise en charge, 5. Facture détaillée, 6. Détail pharmacie, 7. Notes des honoraires médecins, 8. Compte rendu opératoire, 9. Résultat anapath

---

### 🧠 LOGIQUE DE RECONNAISSANCE, RECTO/VERSO & CAS PATIENT = ASSURÉ (SMART MOCK)

1. **Détection du type de document et gestion Patient = Assuré :**

   - Contexte : Le patient actif est "Ouassim BEN MASSAOUD" (CIN: S774138), assuré par lui-même. La pièce "CIN Assuré" est couverte par la "CIN Patient".

   - Reconnaissance du fichier (case-insensitive) :

     * Mots-clés 'pec' ou 'demande' ➔ Demande de PEC

     * Mots-clés 'note' ou 'confidentielle' ➔ Note confidentielle

     * Mots-clés 'radio', 'scanner', 'echo' ou 'irm' ➔ Compte rendu radiologique

     * Mots-clés 'cin' + 'recto' (ou 'front') ➔ CIN Patient (Recto)

     * Mots-clés 'cin' + 'verso' (ou 'back') ➔ CIN Patient (Verso)

     * Mot-clé 'cin' ou 'identite' seul ➔ Modale : "Est-ce le Recto ou le Verso de la CIN ?"

     * Mots-clés 'mutuelle' ou 'carte' ➔ Carte mutuelle / Droit d'assuré (portail)

   - Si aucun mot-clé ne correspond, ouvrir la modale de classification manuelle.

2. **Validation dans la Checklist vs Comptage dynamique dans l'Ordre du dossier :**

   - La ligne "CIN assuré / Passeport" est validée automatiquement (Patient = Assuré).

   - La ligne "CIN patient / Passeport" passe au vert dès que **Recto ET Verso** sont importés.

   - Les scans physiques sont classés à leur position exacte selon l'ordre strict enregistré dans le paramétrage :

     1. Demande de PEC

     2. Note confidentielle

     3. Compte rendu radiologique

     4. CIN Patient (Recto)

     5. CIN Patient (Verso)

     6. Carte mutuelle / Droit d'assuré (portail)

3. **Détection de l'orientation & Rotation :**

   - Rotation CSS (90°, 180° ou 270°) si le nom contient 'vertical', 'portrait' ou 'inverse'.

   - Affichage du badge d'angle et redressement automatique en format paysage lors du clic sur `[IA : ranger & redresser]`.

4. **Scénarios d'audit IA & Re-contrôle :**

   - **Pièce manquante :** Alerte "Document incomplet / manquant" avec bouton `[Ajouter la pièce]`.

   - **Anomalie :** Si le fichier contient `anom` ou `anomalie`, alerte détaillée avec bouton `[Remplacer la pièce]`.

   - **Re-contrôle :** Clic sur `[Lancer le contrôle IA]` après ajout/remplacement. Dès 100% de conformité, déverrouillage immédiat des boutons `[Télécharger le dossier (PDF)]` et `[Transmettre à la PEC]`.

---

### 🚀 LIVRABLE ATTENDU

Un prototype complet, fluide et entièrement interactif avec une interface Glassmorphism Bleu Navy monopage. L'administrateur peut configurer les interventions, supprimer/ajouter des pièces, réordonner et enregistrer l'ordre strict dans le sous-module de Paramétrage (sans la section des règles de contrôle). Le sous-module Dossiers d'Intervention hérite instantanément de ces configurations pour réaliser l'audit IA, afficher l'aperçu réel et compiler le dossier PDF final.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/96e5fae8-f6f6-4d86-bd7e-e5d2ecc4b4f1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
