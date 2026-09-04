import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { quotes, type Quote } from "../data/quotes";

const HISTORY_KEY = "quotely_history";
const FAVORITES_KEY = "quotely_favorites";
const THEME_KEY = "quotely_theme";

export default function HistoryScreen() {
    const [history, setHistory] = useState<Quote[]>([]);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [darkMode, setDarkMode] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const [savedHistory, savedFavorites, savedTheme] =
                await Promise.all([
                    AsyncStorage.getItem(HISTORY_KEY),
                    AsyncStorage.getItem(FAVORITES_KEY),
                    AsyncStorage.getItem(THEME_KEY),
                ]);

            if (savedHistory) {
                const ids: number[] = JSON.parse(savedHistory);

                const historyQuotes = ids
                    .map((id) => quotes.find((quote) => quote.id === id))
                    .filter((quote): quote is Quote => quote !== undefined);

                setHistory(historyQuotes);
            }

            if (savedFavorites) {
                setFavorites(JSON.parse(savedFavorites));
            }

            if (savedTheme === "dark") {
                setDarkMode(true);
            }
        } catch (error) {
            console.log("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (id: number) => {
        try {
            const updatedFavorites = favorites.includes(id)
                ? favorites.filter((favoriteId) => favoriteId !== id)
                : [...favorites, id];

            setFavorites(updatedFavorites);

            await AsyncStorage.setItem(
                FAVORITES_KEY,
                JSON.stringify(updatedFavorites)
            );
        } catch (error) {
            console.log("Error updating favorite:", error);
        }
    };

    const clearHistory = () => {
        if (history.length === 0) {
            return;
        }

        Alert.alert(
            "Clear History",
            "Are you sure you want to remove all recently viewed quotes?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(HISTORY_KEY);
                            setHistory([]);
                        } catch (error) {
                            console.log("Error clearing history:", error);
                        }
                    },
                },
            ]
        );
    };

    const openQuote = (quote: Quote) => {
        router.replace({
            pathname: "/",
            params: {
                quoteId: String(quote.id),
            },
        });
    };

    const filteredHistory = history.filter((quote) => {
        const search = searchText.toLowerCase().trim();

        if (!search) {
            return true;
        }

        return (
            quote.text.toLowerCase().includes(search) ||
            quote.author.toLowerCase().includes(search) ||
            quote.category.toLowerCase().includes(search)
        );
    });

    const backgroundColor = darkMode ? "#0F1115" : "#F7F8FC";
    const cardColor = darkMode ? "#181B22" : "#FFFFFF";
    const textColor = darkMode ? "#FFFFFF" : "#171923";
    const secondaryText = darkMode ? "#A9AFBD" : "#6B7280";
    const borderColor = darkMode ? "#292E38" : "#E8EAF0";

    const renderQuote = ({ item, index }: { item: Quote; index: number }) => {
        const isFavorite = favorites.includes(item.id);

        return (
            <Pressable
                onPress={() => openQuote(item)}
                style={({ pressed }) => [
                    styles.quoteCard,
                    {
                        backgroundColor: cardColor,
                        borderColor,
                        opacity: pressed ? 0.85 : 1,
                    },
                ]}
            >
                <View style={styles.topRow}>
                    <View style={styles.numberCircle}>
                        <Text style={styles.numberText}>{index + 1}</Text>
                    </View>

                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>

                    <Pressable
                        onPress={() => toggleFavorite(item.id)}
                        hitSlop={10}
                        style={styles.favoriteButton}
                    >
                        <Text style={styles.favoriteIcon}>
                            {isFavorite ? "♥" : "♡"}
                        </Text>
                    </Pressable>
                </View>

                <Text style={[styles.quoteText, { color: textColor }]}>
                    “{item.text}”
                </Text>

                <View style={styles.bottomRow}>
                    <Text style={[styles.authorText, { color: secondaryText }]}>
                        — {item.author}
                    </Text>

                    <Text style={[styles.viewText, { color: secondaryText }]}>
                        View →
                    </Text>
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor }]}
            edges={["top", "bottom"]}
        >
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={[
                        styles.backButton,
                        {
                            backgroundColor: cardColor,
                            borderColor,
                        },
                    ]}
                >
                    <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
                </Pressable>

                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>
                        Quote History
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: secondaryText }]}>
                        {history.length} recently viewed{" "}
                        {history.length === 1 ? "quote" : "quotes"}
                    </Text>
                </View>

                <Pressable
                    onPress={clearHistory}
                    disabled={history.length === 0}
                    style={[
                        styles.clearButton,
                        {
                            backgroundColor:
                                history.length === 0
                                    ? darkMode
                                        ? "#22252D"
                                        : "#EDEEF2"
                                    : "#FFE8E8",
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.clearButtonText,
                            {
                                color:
                                    history.length === 0
                                        ? secondaryText
                                        : "#E05252",
                            },
                        ]}
                    >
                        Clear
                    </Text>
                </Pressable>
            </View>

            {history.length > 0 && (
                <View
                    style={[
                        styles.searchContainer,
                        {
                            backgroundColor: cardColor,
                            borderColor,
                        },
                    ]}
                >
                    <Text style={styles.searchIcon}>⌕</Text>

                    <TextInput
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder="Search your history..."
                        placeholderTextColor={secondaryText}
                        style={[styles.searchInput, { color: textColor }]}
                    />

                    {searchText.length > 0 && (
                        <Pressable
                            onPress={() => setSearchText("")}
                            hitSlop={10}
                        >
                            <Text style={[styles.clearSearch, { color: secondaryText }]}>
                                ×
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {loading ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyTitle, { color: textColor }]}>
                        Loading history...
                    </Text>
                </View>
            ) : history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View
                        style={[
                            styles.emptyIconContainer,
                            {
                                backgroundColor: darkMode ? "#20242D" : "#ECEBFF",
                            },
                        ]}
                    >
                        <Text style={styles.emptyIcon}>🕘</Text>
                    </View>

                    <Text style={[styles.emptyTitle, { color: textColor }]}>
                        No History Yet
                    </Text>

                    <Text style={[styles.emptyDescription, { color: secondaryText }]}>
                        Quotes you view will automatically appear here.
                    </Text>

                    <Pressable
                        onPress={() => router.replace("/")}
                        style={styles.exploreButton}
                    >
                        <Text style={styles.exploreButtonText}>
                            Explore Quotes
                        </Text>
                    </Pressable>
                </View>
            ) : filteredHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.noResultIcon}>🔎</Text>

                    <Text style={[styles.emptyTitle, { color: textColor }]}>
                        No Quotes Found
                    </Text>

                    <Text style={[styles.emptyDescription, { color: secondaryText }]}>
                        Try searching for another quote, author, or category.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredHistory}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderQuote}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 15,
    },

    backButton: {
        width: 43,
        height: 43,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    backIcon: {
        fontSize: 34,
        lineHeight: 36,
        fontWeight: "300",
        marginTop: -3,
    },

    headerTextContainer: {
        flex: 1,
        marginLeft: 13,
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.4,
    },

    headerSubtitle: {
        fontSize: 12,
        marginTop: 3,
        fontWeight: "500",
    },

    clearButton: {
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 12,
    },

    clearButtonText: {
        fontSize: 12,
        fontWeight: "800",
    },

    searchContainer: {
        height: 50,
        marginHorizontal: 18,
        marginBottom: 14,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
    },

    searchIcon: {
        fontSize: 25,
        marginRight: 9,
        color: "#8A7CFF",
        marginTop: -4,
    },

    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
    },

    clearSearch: {
        fontSize: 25,
        fontWeight: "300",
    },

    listContent: {
        paddingHorizontal: 18,
        paddingTop: 2,
        paddingBottom: 30,
    },

    quoteCard: {
        borderRadius: 21,
        borderWidth: 1,
        padding: 17,
        marginBottom: 13,
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },

    numberCircle: {
        width: 29,
        height: 29,
        borderRadius: 15,
        backgroundColor: "#ECEBFF",
        alignItems: "center",
        justifyContent: "center",
    },

    numberText: {
        color: "#7568E8",
        fontSize: 11,
        fontWeight: "800",
    },

    categoryBadge: {
        marginLeft: 8,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 9,
        backgroundColor: "#F0EEFF",
    },

    categoryText: {
        color: "#7568E8",
        fontSize: 10,
        fontWeight: "800",
    },

    favoriteButton: {
        marginLeft: "auto",
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
    },

    favoriteIcon: {
        fontSize: 23,
        color: "#E05275",
    },

    quoteText: {
        fontSize: 17,
        lineHeight: 26,
        fontWeight: "700",
        letterSpacing: -0.2,
    },

    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
    },

    authorText: {
        flex: 1,
        fontSize: 12,
        fontWeight: "600",
    },

    viewText: {
        fontSize: 11,
        fontWeight: "700",
    },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 35,
        paddingBottom: 60,
    },

    emptyIconContainer: {
        width: 78,
        height: 78,
        borderRadius: 39,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },

    emptyIcon: {
        fontSize: 34,
    },

    noResultIcon: {
        fontSize: 42,
        marginBottom: 16,
    },

    emptyTitle: {
        fontSize: 21,
        fontWeight: "800",
        textAlign: "center",
    },

    emptyDescription: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: "center",
        marginTop: 8,
        maxWidth: 290,
    },

    exploreButton: {
        marginTop: 20,
        backgroundColor: "#7568E8",
        paddingHorizontal: 21,
        paddingVertical: 12,
        borderRadius: 14,
    },

    exploreButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },
});