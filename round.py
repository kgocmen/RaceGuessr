from guess import check_guess
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import euclidean_distances
from sentence_transformers import SentenceTransformer
import settings
from time import sleep

def score_guess_ranked(guess, top10_list):
    score_table = settings.SCORES
    if guess in top10_list:
        rank = top10_list.index(guess)
        return score_table[rank]
    else:
        return None

def compute_fallback_score(guess, df, synthetic_vector, results):
    try:
        # Only use PC columns
        pc_columns = [col for col in df.columns if col.startswith("PC")]
        guess_vec = df.loc[guess, pc_columns].values
        dist = 100*euclidean_distances([synthetic_vector], [guess_vec])[0][0]
        rank = results[results["Population"] == guess].index[0] + 1

        if 11 <= rank <= 20:
            max_dist = results.iloc[19]["Distance"]
            min_dist = results.iloc[10]["Distance"]
            score = 10 + (max_dist - dist) / (max_dist - min_dist + 1e-8) * 10
            return round(score)

        elif 21 <= rank <= 50:
            max_dist = results.iloc[49]["Distance"]
            min_dist = results.iloc[20]["Distance"]
            score = (max_dist - dist) / (max_dist - min_dist + 1e-8) * 10
            return round(score)

        else:
            return 0
    except:
        return 0

def model_round(k):
    # Start with one random region
    reg_set = set([np.random.choice(settings.MATRIX[0])])
    while len(reg_set) < k:
        candidates = set()
        for region in reg_set:
            candidates.update(settings.MATRIX[region])
        candidates = candidates - reg_set  # only new regions
        reg_set.update(np.random.choice(list(candidates), size=1, replace=False))

    return [settings.MAP[i] for i in list(reg_set)]

def custom_regions():
    print(settings.TEXTS["custom"])
    while True:
        try:
            regions = input("Regions (1-9): ").strip().split("-")
            if not regions:
                return 0
            wanted_regions = []
            if "*" in regions[0]:
                wanted_regions = [1,2,3,4,5,6,7,8]
            else:
                for region in regions[0]:
                    wanted_regions.append(int(region))
            try:
                for region in regions[1]:
                    wanted_regions.remove(int(region))
            except:
                pass

            if any(region == 9 for region in wanted_regions):
                print(settings.TEXTS["composite"])
            elif wanted_regions:
                return [settings.MAP[i] for i in wanted_regions]
            else:
                print(settings.TEXTS["inv_custom"])

        except ValueError:
            print(settings.TEXTS["inv_custom"])
    

def show_regions(reg):
    for r in reg:
        if r == reg[-1]:
            print(f"{r}")
        else:
            print(f"{r}", end=",")
 



def run_round(dataframe, num_players, player_names, regions):
    n = np.random.randint(2, 5)

    show_regions(regions)

    filtered = dataframe[dataframe["Region"].isin(regions)]
    chosen_pops = np.random.choice(filtered.index, size=n, replace=False)

    valid_weights = settings.WEIGHTS
    while True:
        weights = np.random.choice(valid_weights, size=n, replace=True)
        if weights.sum() == settings.TOTAL:
            break
    proportions = weights / settings.TOTAL

    # Only use PC columns
    pc_columns = [col for col in dataframe.columns if col.startswith("PC")]
    vectors = dataframe.loc[chosen_pops, pc_columns].values
    synthetic_vector = np.average(vectors, axis=0, weights=proportions)
    all_vectors = dataframe[pc_columns].values
    distances = 100 * euclidean_distances([synthetic_vector], all_vectors)[0]

    # Create distance-ranked DataFrame
    results = pd.DataFrame({
        "Population": dataframe.index,
        "Distance": distances
    }).sort_values(by="Distance").reset_index(drop=True)

    top10 = results.head(10)
    top10_names = top10["Population"].tolist()

    print(settings.TEXTS["guess"])
    for pop, weight in zip(chosen_pops, proportions):
        print(f" - {int(weight * 100)}% {pop}")

    scores = []
    guesses = []
    print(settings.TEXTS["guess2"])
    for i in range(num_players):
        while True:
            raw_guess = input(f"{player_names[i]} : ").strip()
            final_guess = check_guess(raw_guess, dataframe)
            if final_guess:
                break
        guesses.append(final_guess)

    for guess in guesses:
        score = score_guess_ranked(guess, top10_names)
        if score is None:
            score = compute_fallback_score(guess, dataframe, synthetic_vector, results)
        scores.append(score)

    print(settings.TEXTS["points"])
    for i, (score, guess) in enumerate(zip(scores, guesses)):
        if guess in top10_names:
            rank = top10_names.index(guess) + 1
            dist = results[results["Population"] == guess]["Distance"].values[0]
            msg = f"{int(score)} ({rank}.{guess}, {dist:.4f})"
        else:
            rank = results[results["Population"] == guess].index[0] + 1
            dist = results[results["Population"] == guess]["Distance"].values[0]
            msg = f"{score} ({rank}.{guess}, {dist:.4f})"
        print(f"{player_names[i]}: {msg}")
    sleep(1)

    print(settings.TEXTS["results"])
    for i, row in top10.iterrows():
        print(f"\t{i + 1}. {row['Population']} ({row['Distance']:.4f})")

    return scores