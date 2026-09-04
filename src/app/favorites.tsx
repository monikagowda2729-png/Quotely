import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Linking,
    Pressable,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { quotes, type Quote } from "../data/quotes";

const FAVORITES_KEY = "quotely_favorites";
const THEME_KEY = "quotely_theme";

const categories = [
    "All",
    "Motivation",
    "Confidence",
    "Success",
    "Dreams",
    "Life",
    "Growth",
    "Wisdom",
];

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<number[]>([]);
    const [darkMode, setDarkMode] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        try {
            const [savedFavorites, savedTheme] = await Promise.all([
                AsyncStorage.getItem(FAVORITES_KEY),
                AsyncStorage.getItem(THEME_KEY),
            ]);

            setFavorites(
                savedFavorites ? JSON.parse(savedFavorites) : []
            );

            setDarkMode(savedTheme === "dark");
        } catch (error) {
            console.log("Error loading favorites:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const showMessage = (text: string) => {
        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 1800);
    };

    const removeFavorite = async (id: number) => {
        try {
            const updated = favorites.filter(
                (favoriteId) => favoriteId !== id
            );

            setFavorites(updated);

            await AsyncStorage.setItem(
                FAVORITES_KEY,
                JSON.stringify(updated)
            );

            showMessage("Removed from favorites");
        } catch (error) {
            console.log("Error removing favorite:", error);
        }
    };

    const confirmRemove = (id: number) => {
        Alert.alert(
            "Remove Favorite",
            "Remove this quote from your favorites?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => removeFavorite(id),
                },
            ]
        );
    };

    const copyQuote = async (quote: Quote) => {
        try {
            await Clipboard.setStringAsync(
                `"${quote.text}" — ${quote.author}`
            );
            showMessage("Quote copied 📋");
        } catch (error) {
            console.log("Copy error:", error);
        }
    };

    const shareQuote = async (quote: Quote) => {
        try {
            await Share.share({
                message: `"${quote.text}"\n\n— ${quote.author}\n\nShared from Quotely`,
            });
        } catch (error) {
            console.log("Share error:", error);
        }
    };

    const searchAuthor = async (author: string) => {
        try {
            const url = `https://www.google.com/search?q=${encodeURIComponent(
                `${author} quotes`
            )}`;

            await Linking.openURL(url);
        } catch (error) {
            console.log("Google search error:", error);
        }
    };

    const favoriteQuotes = useMemo(() => {
        const search = searchText.toLowerCase().trim();

        return quotes.filter((quote) => {
            const isFavorite = favorites.includes(quote.id);

            const matchesCategory =
                selectedCategory === "All" ||
                quote.category === selectedCategory;

            const matchesSearch =
                !search ||
                quote.text.toLowerCase().includes(search) ||
                quote.author.toLowerCase().includes(search) ||
                quote.category.toLowerCase().includes(search);

            return isFavorite && matchesCategory && matchesSearch;
        });
    }, [favorites, selectedCategory, searchText]);

    const clearAllFavorites = () => {
        if (favorites.length === 0) {
            return;
        }

        Alert.alert(
            "Clear All Favorites",
            "Are you sure you want to remove all saved quotes?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(FAVORITES_KEY);
                            setFavorites([]);
                            showMessage("All favorites cleared");
                        } catch (error) {
                            console.log("Clear favorites error:", error);
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

    const backgroundColor = darkMode ? "#0F1115" : "#F7F8FC";
    const cardColor = darkMode ? "#181B22" : "#FFFFFF";
    const textColor = darkMode ? "#FFFFFF" : "#171923";
    const secondaryColor = darkMode ? "#A9AFBD" : "#737887";
    const borderColor = darkMode ? "#292E38" : "#E7E9EF";

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor }]}
            edges={["top", "bottom"]}
        >
            {/* HEADER */}
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
                    <Text style={[styles.backText, { color: textColor }]}>
                        ‹
                    </Text>
                </Pressable>

                <View style={styles.headerInfo}>
                    <Text
                        style={[styles.title, { color: textColor }]}
                    >
                        Favorites
                    </Text>

                    <Text
                        style={[
                            styles.subtitle,
                            { color: secondaryColor },
                        ]}
                    >
                        {favorites.length} saved{" "}
                        {favorites.length === 1 ? "quote" : "quotes"}
                    </Text>
                </View>

                {favorites.length > 0 && (
                    <Pressable
                        onPress={clearAllFavorites}
                        style={styles.clearButton}
                    >
                        <Text style={styles.clearText}>Clear All</Text>
                    </Pressable>
                )}
            </View>

            {/* SEARCH */}
            {favorites.length > 0 && (
                <View
                    style={[
                        styles.searchBox,
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
                        placeholder="Search your favorites..."
                        placeholderTextColor={secondaryColor}
                        style={[
                            styles.searchInput,
                            { color: textColor },
                        ]}
                    />

                    {searchText.length > 0 && (
                        <Pressable
                            onPress={() => setSearchText("")}
                            hitSlop={10}
                        >
                            <Text
                                style={[
                                    styles.closeSearch,
                                    { color: secondaryColor },
                                ]}
                            >
                                ×
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* CATEGORY FILTERS */}
            {favorites.length > 0 && (
                <FlatList
                    horizontal
                    data={categories}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                    renderItem={({ item }) => {
                        const selected = selectedCategory === item;

                        return (
                            <Pressable
                                onPress={() => setSelectedCategory(item)}
                                style={[
                                    styles.categoryButton,
                                    selected
                                        ? styles.categoryButtonSelected
                                        : {
                                            backgroundColor: cardColor,
                                            borderColor,
                                        },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.categoryButtonText,
                                        selected
                                            ? styles.categoryButtonTextSelected
                                            : { color: secondaryColor },
                                    ]}
                                >
                                    {item}
                                </Text>
                            </Pressable>
                        );
                    }}
                />
            )}

            {/* EMPTY STATE */}
            {favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View
                        style={[
                            styles.emptyCircle,
                            {
                                backgroundColor: darkMode
                                    ? "#20242D"
                                    : "#ECEBFF",
                            },
                        ]}
                    >
                        <Text style={styles.emptyHeart}>♡</Text>
                    </View>

                    <Text
                        style={[styles.emptyTitle, { color: textColor }]}
                    >
                        No Favorites Yet
                    </Text>

                    <Text
                        style={[
                            styles.emptyDescription,
                            { color: secondaryColor },
                        ]}
                    >
                        Save quotes you love and they'll appear here.
                    </Text>

                    <Pressable
                        onPress={() => router.back()}
                        style={styles.exploreButton}
                    >
                        <Text style={styles.exploreButtonText}>
                            Explore Quotes
                        </Text>
                    </Pressable>
                </View>
            ) : favoriteQuotes.length === 0 ? (
                /* NO SEARCH RESULTS */
                <View style={styles.emptyContainer}>
                    <Text style={styles.noResultIcon}>🔎</Text>

                    <Text
                        style={[styles.emptyTitle, { color: textColor }]}
                    >
                        No Quotes Found
                    </Text>

                    <Text
                        style={[
                            styles.emptyDescription,
                            { color: secondaryColor },
                        ]}
                    >
                        Try another search or category.
                    </Text>

                    <Pressable
                        onPress={() => {
                            setSearchText("");
                            setSelectedCategory("All");
                        }}
                        style={styles.exploreButton}
                    >
                        <Text style={styles.exploreButtonText}>
                            Show All Favorites
                        </Text>
                    </Pressable>
                </View>
            ) : (
                /* FAVORITE LIST */
                <FlatList
                    data={favoriteQuotes}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    renderItem={({ item, index }) => (
                        <Pressable
                            onPress={() => openQuote(item)}
                            style={({ pressed }) => [
                                styles.quoteCard,
                                {
                                    backgroundColor: cardColor,
                                    borderColor,
                                    opacity: pressed ? 0.88 : 1,
                                },
                            ]}
                        >
                            {/* CARD TOP */}
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.numberCircle}>
                                        <Text style={styles.numberText}>
                                            {index + 1}
                                        </Text>
                                    </View>

                                    <View style={styles.category}>
                                        <Text style={styles.categoryText}>
                                            {item.category}
                                        </Text>
                                    </View>
                                </View>

                                <Pressable
                                    onPress={() => confirmRemove(item.id)}
                                    hitSlop={8}
                                    style={styles.removeButton}
                                >
                                    <Text style={styles.removeIcon}>♥</Text>
                                </Pressable>
                            </View>

                            {/* QUOTE */}
                            <Text
                                style={[
                                    styles.quoteText,
                                    { color: textColor },
                                ]}
                            >
                                “{item.text}”
                            </Text>

                            {/* AUTHOR */}
                            <Pressable
                                onPress={() => searchAuthor(item.author)}
                                style={styles.authorButton}
                            >
                                <Text
                                    style={[
                                        styles.author,
                                        { color: secondaryColor },
                                    ]}
                                >
                                    — {item.author}
                                </Text>

                                <Text style={styles.googleIcon}>
                                    ↗
                                </Text>
                            </Pressable>

                            {/* ACTIONS */}
                            <View style={styles.actions}>
                                <Pressable
                                    onPress={() => copyQuote(item)}
                                    style={[
                                        styles.actionButton,
                                        {
                                            backgroundColor: darkMode
                                                ? "#242832"
                                                : "#F3F4F7",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.actionText,
                                            { color: textColor },
                                        ]}
                                    >
                                        📋 Copy
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => shareQuote(item)}
                                    style={[
                                        styles.actionButton,
                                        {
                                            backgroundColor: darkMode
                                                ? "#242832"
                                                : "#F3F4F7",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.actionText,
                                            { color: textColor },
                                        ]}
                                    >
                                        📤 Share
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => openQuote(item)}
                                    style={styles.viewButton}
                                >
                                    <Text style={styles.viewText}>
                                        View →
                                    </Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    )}
                />
            )}

            {/* TOAST */}
            {message !== "" && (
                <View style={styles.toast}>
                    <Text style={styles.toastText}>{message}</Text>
                </View>
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
        paddingBottom: 14,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    backText: {
        fontSize: 34,
        fontWeight: "300",
        marginTop: -4,
    },

    headerInfo: {
        flex: 1,
        marginLeft: 13,
    },

    title: {
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: -0.5,
    },

    subtitle: {
        fontSize: 12,
        marginTop: 3,
        fontWeight: "500",
    },

    clearButton: {
        backgroundColor: "#FFE8EB",
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 12,
    },

    clearText: {
        color: "#DF5267",
        fontSize: 11,
        fontWeight: "800",
    },

    searchBox: {
        height: 50,
        marginHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
    },

    searchIcon: {
        fontSize: 25,
        color: "#7568E8",
        marginRight: 8,
        marginTop: -4,
    },

    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
    },

    closeSearch: {
        fontSize: 25,
        fontWeight: "300",
    },

    categoryList: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 12,
    },

    categoryButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        marginRight: 8,
    },

    categoryButtonSelected: {
        backgroundColor: "#7568E8",
        borderColor: "#7568E8",
    },

    categoryButtonText: {
        fontSize: 11,
        fontWeight: "700",
    },

    categoryButtonTextSelected: {
        color: "#FFFFFF",
    },

    list: {
        paddingHorizontal: 18,
        paddingTop: 2,
        paddingBottom: 35,
    },

    quoteCard: {
        borderRadius: 22,
        borderWidth: 1,
        padding: 18,
        marginBottom: 14,
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 15,
    },

    cardHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    numberCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#ECEBFF",
        alignItems: "center",
        justifyContent: "center",
    },

    numberText: {
        color: "#7568E8",
        fontSize: 11,
        fontWeight: "900",
    },

    category: {
        marginLeft: 8,
        backgroundColor: "#F0EEFF",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },

    categoryText: {
        color: "#7568E8",
        fontSize: 10,
        fontWeight: "800",
    },

    removeButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#FFF0F2",
        alignItems: "center",
        justifyContent: "center",
    },

    removeIcon: {
        color: "#E94B63",
        fontSize: 19,
    },

    quoteText: {
        fontSize: 18,
        lineHeight: 28,
        fontWeight: "700",
        letterSpacing: -0.2,
    },

    authorButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 14,
    },

    author: {
        fontSize: 13,
        fontWeight: "700",
    },

    googleIcon: {
        color: "#7568E8",
        fontSize: 15,
        marginLeft: 5,
        fontWeight: "800",
    },

    actions: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 17,
        gap: 7,
    },

    actionButton: {
        paddingHorizontal: 10,
        paddingVertical: 9,
        borderRadius: 11,
    },

    actionText: {
        fontSize: 10,
        fontWeight: "700",
    },

    viewButton: {
        marginLeft: "auto",
        paddingHorizontal: 8,
        paddingVertical: 9,
    },

    viewText: {
        color: "#7568E8",
        fontSize: 11,
        fontWeight: "800",
    },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 35,
        paddingBottom: 60,
    },

    emptyCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },

    emptyHeart: {
        fontSize: 52,
        color: "#AEB2BE",
    },

    noResultIcon: {
        fontSize: 44,
        marginBottom: 16,
    },

    emptyTitle: {
        fontSize: 23,
        fontWeight: "900",
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
        paddingVertical: 13,
        borderRadius: 14,
    },

    exploreButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    toast: {
        position: "absolute",
        bottom: 28,
        alignSelf: "center",
        backgroundColor: "#171923",
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 15,
    },

    toastText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
});